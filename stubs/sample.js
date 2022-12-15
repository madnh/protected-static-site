const { defineConfig, basicAuthMiddleware } = require('serve-di')

module.exports = defineConfig({
  middlewares: [
    // Filter access by whitelist IP
    filterIpMiddleware({
      enable: true,
      allowIps: [
        '192.168.100',    // Full IP address
        '192.168.100/32', // Full IP address with net mask
        '1.2.3.4/27',     // Net mask IPs
        
      ]
    }),
    // Basic authenticated middleware
    basicAuthMiddleware({
      enable: true,
      users: [
        {
          username: 'vip',
          password: '123123'
        }
      ]
    })
  ],

  // Proxy to APIs
  proxies: {
    '/api': 'https://example.com'
  },
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
