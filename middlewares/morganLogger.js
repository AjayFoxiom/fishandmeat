const morgan = require('morgan')
const fs = require('fs')
const path = require('path')


const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const accessLogStream = fs.createWriteStream(
  path.join(logDir, 'access.log'),
  { flags: 'a' }
);

const fileLogger = morgan('combined', { stream: accessLogStream });
const consoleLogger = morgan('dev');

module.exports = [fileLogger, consoleLogger];

