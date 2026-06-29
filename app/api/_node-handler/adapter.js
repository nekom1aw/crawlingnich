async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return undefined;

  const contentType = request.headers.get('content-type') || '';
  const text = await request.text();
  if (!text) return undefined;

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text);
    } catch {
      return {};
    }
  }

  return text;
}

function createRequest(request, body) {
  const url = new URL(request.url);
  const query = {};

  for (const [key, value] of url.searchParams.entries()) {
    if (query[key]) {
      query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value];
    } else {
      query[key] = value;
    }
  }

  return {
    method: request.method,
    url: `${url.pathname}${url.search}`,
    query,
    body,
    headers: Object.fromEntries(request.headers.entries()),
    signal: request.signal
  };
}

function createResponseController() {
  let statusCode = 200;
  let body = '';
  let finished = false;
  const headers = new Headers();

  function finish(value = '') {
    if (finished) return;
    body = value;
    finished = true;
  }

  return {
    response: {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(key, value) {
        headers.set(key, String(value));
        return this;
      },
      getHeader(key) {
        return headers.get(key);
      },
      json(value) {
        if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json; charset=utf-8');
        finish(JSON.stringify(value));
        return this;
      },
      send(value) {
        finish(value == null ? '' : value);
        return this;
      },
      end(value = '') {
        finish(value);
        return this;
      }
    },
    toResponse() {
      return new Response(body, { status: statusCode, headers });
    }
  };
}

async function runNodeHandler(handler, request) {
  const body = await readBody(request);
  const req = createRequest(request, body);
  const controller = createResponseController();

  await handler(req, controller.response);
  return controller.toResponse();
}

module.exports = { runNodeHandler };
