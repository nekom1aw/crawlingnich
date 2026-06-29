const { runNodeHandler } = require('../_node-handler/adapter');
const handler = require('../../../lib/server/article-5w1h');

function POST(request) {
  return runNodeHandler(handler, request);
}

module.exports = { POST };
