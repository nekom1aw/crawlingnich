const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const dev = process.env.NEXT_DEV === '1' || process.env.NODE_ENV === 'development';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname, () => {
    console.log(`Next.js server ready on http://${hostname}:${port}`);
  });
});
