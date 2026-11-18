/**
 * Cloudflare Worker entrypoint for WorkTrack ("worktrack" Worker service)
 * - Serves all React SPA static assets from ./frontend/dist (with SPA fallback)
 * - Routes /api/* requests to BACKEND_ORIGIN when configured in Worker environment variables
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const backendOrigin = (env.BACKEND_ORIGIN || '').replace(/\/+$/, '');

      if (!backendOrigin) {
        if (url.pathname === '/api/v1/health') {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                status: 'ok',
                service: 'worktrack-cloudflare-worker',
                backendOriginConfigured: false,
                timestamp: new Date().toISOString(),
              },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'BACKEND_ORIGIN_NOT_CONFIGURED',
              message:
                'Add BACKEND_ORIGIN in Cloudflare Worker Settings -> Variables and Secrets pointing to your Node.js API URL.',
            },
          }),
          { status: 502, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const targetUrl = `${backendOrigin}${url.pathname}${url.search}`;
      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-Host', url.host);
      headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

      const init = {
        method: request.method,
        headers,
        redirect: 'manual',
      };

      if (!['GET', 'HEAD'].includes(request.method)) {
        init.body = request.body;
      }

      const response = await fetch(targetUrl, init);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
    }

    return env.ASSETS.fetch(request);
  },
};
