import jwt from 'jsonwebtoken';
import config from '../config/environment';

const ANONYMOUS_TOKEN_DATA = {
  personId: null,
  accessLevel: 128,
  ip: null
};

function createToken(req, res, userData, expiresIn) {
  const token = jwt.sign(userData, config.jwt.secret, { expiresIn: expiresIn || config.jwt.expires }); // eslint-disable-line no-param-reassign
  req.user = userData;                                                                    // eslint-disable-line no-param-reassign
  req.session.token = token;                                                              // eslint-disable-line no-param-reassign

  return token;
}

function createAnonymousToken(req, res) {
  return createToken(req, res, ANONYMOUS_TOKEN_DATA, '365 days');
}

function getSessionData(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.session && req.session.token) {
    token = req.session.token;
  }

  if (!token) {
    createAnonymousToken(req, res);
  } else {
    try {
      try {
        const user = jwt.verify(token, config.jwt.secret, { ignoreExpiration: false }); // eslint-disable-line no-param-reassign
        if (process.env.NODE_ENV !== 'production') {
          console.log('USER:', user); // eslint-disable-line no-console
        }
        req.user = user; // eslint-disable-line no-param-reassign
        if (user.personId) {
          delete user.iat;
          delete user.exp;
          createToken(req, res, user);
        }
      } catch (e) {
        console.log(e); // eslint-disable-line no-console
        createAnonymousToken(req, res);
      }
    } catch (e) {
      console.log(e); // eslint-disable-line no-console
      createAnonymousToken(req, res);
    }
  }

  next();
}

export {
  createToken,
  createAnonymousToken,
  getSessionData,
};
