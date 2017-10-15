const bunyan = require('bunyan');
const fs = require('fs');
const EmailStream = require('./bunyan-stream-email').EmailStream;
const config = require('../config/environment');

const DIR = './logs';
const LOG_PATH = `${DIR}/orders-api-error.log`;

const emailStream = new EmailStream(
  // Nodemailer mailOptions
  {
    from: 'noreply@test.com',
    to: 'applogs@test.com'
  },
  // Nodemailer transportOptions
  config.mail
);

// Create log dir if it doesn't already exist
if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR);
}

// Override default bunyan.stdSerializers to add body output
const stdSerializers = bunyan.stdSerializers;
stdSerializers.req = function (req) { // eslint-disable-line
  if (!req || !req.connection)  // eslint-disable-line
    return req;
  return {
    method: req.method,
    url: req.url,
    remoteAddress: req.connection.remoteAddress,
    remotePort: req.connection.remotePort,
    headers: req.headers,
    body: req.body ? req.body : {}
  };
};

const streams = [
  {
    level: 'info',
    stream: process.stdout // log INFO and above to stdout
  },
  {
    level: 'error',
    path: LOG_PATH,  // log ERROR and above to a file
    src: true
  }
];

// In production log error to local log and email to applogs email address
if (config.env === 'production') {
  streams.push(
    {
      level: 'error',
      type: 'raw', // You should use EmailStream with 'raw' type!
      stream: emailStream,
      src: true
    }
  );
}

const logger = bunyan.createLogger({
  name: 'orders-api',
  serializers: stdSerializers,
  streams
});

module.exports = logger;
