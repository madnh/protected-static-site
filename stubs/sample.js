// @ts-check
// const { defineConfig, basicAuthMiddleware, filterIpMiddleware } = require('serve-di')
/*
 * @type {import('serve-di').Config}
 */
const config = {
  proxies: {
    '/api': 'https://example.com',
  },
  serveHandler: {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true,
  },
  logs: {
    url: true,
  },
};

module.exports = config
