const { runNodeHandler } = require('../_node-handler/adapter');
const handler = require('../../../lib/server/crawl-all');

function GET(request) {
  return runNodeHandler(handler, request);
}

function POST(request) {
  return runNodeHandler(handler, request);
}

module.exports = { GET, POST };
