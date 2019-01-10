/* eslint-disable no-console, no-shadow */
import chalk from 'chalk';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import graphQLHTTP from 'express-graphql';
import session from 'express-session';
import bodyParser from 'body-parser';
import RateLimit from 'express-rate-limit';
import {
  graphqlBatchHTTPWrapper,
} from 'react-relay-network-layer';
import config from './config/environment';
import schema from './data/schema';
import database from './data/database';
import logger from './utils/logger-bunyan';
import {
  getSessionData,
} from './utils';
// Setup Session store in MySQL
const KnexSessionStore = require('connect-session-knex')(session);
// GraphQL web server
const server = express();

const corsOptions = {
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const multerMiddleware = multer(
  {
    storage: multer.memoryStorage(),
    limits: { fieldSize: 4 * 1024 * 1024 }, // 4MB
    fileFilter: (req, file, cb) => {
      if (req.files) {
        const extension = file.originalname.split('.').pop();
        const allowedTypes = ['pdf', 'xml', 'jpg', 'png', 'csv', 'tsv'];
        const isAllowed = allowedTypes.indexOf(extension.toLowerCase()) !== -1;

        if (isAllowed) {
          cb(null, true);
        } else {
          req.fileValidationError = 'Unsupported type of attachment. Supported types: pdf, xml, jpg, png, csv or tsv.'; // eslint-disable-line no-param-reassign
          cb(null, false, new Error('Attached files are not in one of supported types'));
        }
      }
    }
  })
  .fields([
    { name: 'someName', maxCount: 1 },
  ]);

// not needed, just an example
const ipLimiter = new RateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 50,
  delayAfter: 30,
  delayMs: 100,
  message: 'Too many requests from this IP, please try again later.',
  handler: (req, res) => {
    res.format({
      html: () => res.status(429).end(),
      json: () => res.status(429).end()
    });
  }
});

const globalLimiter = new RateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  delayAfter: 60,
  delayMs: 10,
  keyGenerator: () => 1,
  handler: (req, res) => {
    res.format({
      html: () => res.status(429).end(),
      json: () => res.status(429).end()
    });
  }
});


server.enable('trust proxy');
server.use(ipLimiter);
server.use(globalLimiter);
server.use(cors(corsOptions));
server.use(bodyParser.json({ limit: '1mb' }));
server.use(bodyParser.urlencoded({ extended: true }));
server.use(session({
  secret: config.cookie.secret,
  resave: false, // do not automatically write to the session store
  saveUninitialized: true, // saved new sessions
  store: new KnexSessionStore({
    tablename: 'session',
    knex: database
  }),
  cookie: {
    httpOnly: true,
    sameSite: false,
    maxAge: config.cookie.maxAge,
    secure: process.env.NODE_ENV !== 'development', // use only in non dev enviroment where there is https enabled
  }
}));
//
server.use(getSessionData);

const graphqlServer = graphQLHTTP((req, res) => ({
  schema,
  graphiql: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'staging'),
  pretty: true,
  rootValue: req,
  context: {
    request: req,
    response: res,
  }
}));


server.use('/batch', graphqlBatchHTTPWrapper(graphqlServer)
);

server.use('/', (req, res, next) => {
  multerMiddleware(req, res, () => {
    if (!req.files || req.files.length === 0) {
      next();
      return;
    }

    if (req.fileValidationError) return res.status(400).send({ fileValidationError: req.fileValidationError }); // eslint-disable-line consistent-return

    const files = Object.keys(req.files).map(fileKey => req.files[fileKey][0]);

    req.body.variables = JSON.parse(req.body.variables);   // eslint-disable-line no-param-reassign
    files.forEach((file) => {
      req.body.variables.input_0[file.fieldname] = file;  // eslint-disable-line no-param-reassign
      if (req.body.variables.input_0[file.fieldname]) {
        req.body.variables.input_0[file.fieldname].buffer = req.body.variables.input_0[file.fieldname].buffer.toString('base64'); // eslint-disable-line no-param-reassign
      }
    });

    next();
  });
});

server.use('/', graphqlServer);

server.listen(config.port, () => console.log(chalk.green(`GraphQL is listening on port ${config.port}`)));

// log-and-crash logic - once an unexpected error (ie. bug) occurs, it is not safe to continue,
// as your application is now in an unpredictable state. You should instead let your application
// crash after logging the error, to start over with a 'clean slate'.
process
  .on('unhandledRejection', reason => logger.error({ err: reason }, 'Unhandled Promise Rejection'))
  .on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception');
    process.exit(1);
  });
