module.exports = function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'API jalan',
    time: new Date().toISOString()
  });
};
