/**
 * Cloudflare Pages Function — Edge API Proxy (/api/*)
 * Proxies /api/v1/* requests from your Cloudflare Pages domain (https://worktrack.pages.dev/api/v1/...)
 * to your backend origin (BACKEND_ORIGIN env var in Cloudflare Pages), keeping HttpOnly JWT cookies
 * 100% same-origin on Cloudflare.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const backendOrigin = (env.BACKEND_ORIGIN || '').replace(/\/+$/, '');

  if (!backendOrigin) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Set BACKEND_ORIGIN in Cloudflare Pages Environment Variables (e.g. https://worktrack-api.onrender.com).',
        },
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${backendOrigin}${incomingUrl.pathname}${incomingUrl.search}`;

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-Host', incomingUrl.host);
  headers.set('X-Forwarded-Proto', incomingUrl.protocol.replace(':', ''));

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
  }

  const response = await fetch(targetUrl, init);
  const responseHeaders = new Headers(response.headers);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}
