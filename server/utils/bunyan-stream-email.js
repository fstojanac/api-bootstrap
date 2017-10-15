const util = require('util');
const stream = require('stream');
const nodemailer = require('nodemailer');

const extend = util._extend; // eslint-disable-line

const Stream = stream.Writable || stream.Stream;

// Levels
const LEVELS = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL',
};

/**
 * Convert level integer to level name string
 */
function levelName(level) {
  return LEVELS[level] || 'LVL' + level;  // eslint-disable-line
}

exports.EmailStream = EmailStream;  // eslint-disable-line
exports.formatSubject = formatSubject;  // eslint-disable-line
exports.formatBody = formatBody;  // eslint-disable-line

function EmailStream(mailOptions, transportOptions) {
  Stream.call(this);
  this.writable = true;

  this._mailOptions = extend({}, mailOptions);  // eslint-disable-line

  this._transportOptions = extend({}, transportOptions);  // eslint-disable-line

  this._transport = nodemailer.createTransport(this._transportOptions);  // eslint-disable-line

  this.formatSubject = exports.formatSubject;
  this.formatBody = exports.formatBody;
}

util.inherits(EmailStream, Stream);

EmailStream.prototype.write = function (log) {  // eslint-disable-line
  const self = this;
  const message = extend({}, this._mailOptions);  // eslint-disable-line

  if (!message.subject) {
    message.subject = this.formatSubject(log);
  }
  message.text = this.formatBody(log);

  this._transport.sendMail(message, function (err, response) {  // eslint-disable-line
    if (err) {
      self.emit('error', err);
    } else {
      self.emit('mailSent', response);
    }
  });
};

EmailStream.prototype.end = function () { // eslint-disable-line
  if (this._transport) {  // eslint-disable-line
    this._transport.close();  // eslint-disable-line
  }
};

function formatSubject(log) {
  return `${levelName(log.level)} ${log.name}/${log.pid} ${log.hostname}`;
}

function formatBody(log) {
  let rows = Object.keys(log).map(function (key, index) {  // eslint-disable-line

    return `* ${key}: ${util.inspect(log[key], { showHidden: false, depth: null })}`;
  });

  return rows.join('\n');
}
