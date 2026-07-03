const { runNodeHandler } = require("../../_node-handler/adapter");
const handler = require("../../../../lib/server/admin-crawl-logs");

function GET(request) {
  return runNodeHandler(handler, request);
}

module.exports = { GET };
