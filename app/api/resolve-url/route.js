const { runNodeHandler } = require("../_node-handler/adapter");
const handler = require("../../../lib/server/resolve-url");

function POST(request) {
  return runNodeHandler(handler, request);
}

module.exports = { POST };
