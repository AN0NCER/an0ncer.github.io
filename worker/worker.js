// Cloudflare Worker для проксирования запросов к Kodik API
// Ключ хранится в переменной окружения KODIK_TOKEN

const KODIK_BASE_URL = 'https://kodikapi.com';
const ALLOWED_ORIGIN = 'https://an0ncer.github.io';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const origin = request.headers.get('Origin') || '';

  if (!origin.startsWith(ALLOWED_ORIGIN)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    const token = KODIK_TOKEN;
    
    if (!token) {
      return new Response(JSON.stringify({ error: 'KODIK_TOKEN not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const kodikUrl = new URL(`${KODIK_BASE_URL}${pathname}`);
    
    kodikUrl.searchParams.set('token', token);
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'token') {
        kodikUrl.searchParams.set(key, value);
      }
    }

    const response = await fetch(kodikUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
      },
    });
  }
}
