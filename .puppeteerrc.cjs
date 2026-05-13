const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer so it gets stored 
  // in the project folder and isn't wiped out by Render.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
