module.exports = {
  poweredByHeader: false,
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/isu-daerah', destination: '/isu-daerah.html' },
      { source: '/summarized-ai', destination: '/summarized-ai.html' }
    ];
  }
};
