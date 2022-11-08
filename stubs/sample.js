const { defineConfig } = require('serve-di')

module.exports = defineConfig({
  serveHandler: {
    public: 'dist',
    etag: true,
    cleanUrls: true,
    directoryListing: false,
    trailingSlash: true
  },
  logs: {
    url: true,
  }
})
