
import { defineConfig, loadEnv } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'path';
  import { visualizer } from 'rollup-plugin-visualizer';

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export default defineConfig(({ mode }) => {
  // Load env without the VITE_ prefix filter (3rd arg = '') so we can access all vars if needed.
  const env = loadEnv(mode, process.cwd(), '');

  // Normalize API URL - convert https://localhost to http://localhost for local dev
  let apiBaseUrl = normalizeBaseUrl(env.VITE_API_BASE_URL || 'https://gateway-dev-1b7e.up.railway.app');
  if (apiBaseUrl.includes('localhost') && apiBaseUrl.startsWith('https://')) {
    apiBaseUrl = apiBaseUrl.replace('https://', 'http://');
    console.log('⚠️  Converted HTTPS localhost to HTTP for proxy:', apiBaseUrl);
  }

  return {
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'next-themes@0.4.6': 'next-themes',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      rollupOptions: {
        plugins:
          mode === 'analyze'
            ? [
                visualizer({
                  filename: 'dist/stats.html',
                  gzipSize: true,
                  brotliSize: true,
                  template: 'treemap',
                  open: false,
                }),
              ]
            : [],
      },
    },
    server: {
      // 3000 on Windows can be reserved/blocked (EACCES). Use Vite default-ish port.
      port: 5173,
      strictPort: false,
      host: '127.0.0.1',
      open: true,
      cors: true,
      proxy: {
        '^/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          // In some Windows/corporate environments HTTPS can be intercepted by a self-signed root CA,
          // which breaks Node TLS verification and causes DEPTH_ZERO_SELF_SIGNED_CERT. This proxy is
          // DEV-only, so we disable TLS verification here to keep local dev unblocked.
          secure: false,
          rewrite: (path) => path,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, req, res) => {
              console.error('❌ Proxy error:', err.message);
              console.error('   Request:', req.method, req.url);
              console.error('   Target:', apiBaseUrl);
              if (err.code === 'ECONNREFUSED') {
                console.error('   ⚠️  Connection refused - is the backend server running?');
                console.error('   💡 Check that the backend is accessible at:', apiBaseUrl);
              }
              if (!res.headersSent) {
                res.writeHead(502, {
                  'Content-Type': 'application/json',
                });
                res.end(JSON.stringify({
                  error: 'Bad Gateway',
                  message: `Cannot connect to backend at ${apiBaseUrl}. Is the server running?`,
                }));
              }
            });
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('➡️  [PROXY] Proxying request:', req.method, req.url, '->', apiBaseUrl + req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('⬅️  [PROXY] Response:', proxyRes.statusCode, req.url);
              // Add CORS headers to all responses
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
              proxyRes.headers['Access-Control-Allow-Headers'] =
                'Content-Type, Authorization, X-Page-Number, X-Page-Size, Accept';
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
              proxyRes.headers['Access-Control-Max-Age'] = '86400';
            });
          },
        },
        '/favorite': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          ws: true,
        },
      },
    },
  };
});