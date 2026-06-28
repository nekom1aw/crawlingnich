function GET() {
  return Response.json({
    status: 'ok',
    message: 'API jalan',
    time: new Date().toISOString()
  });
}

module.exports = { GET };
