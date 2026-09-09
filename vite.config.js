import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { updateMockDataFile, getSyncState } from './scripts/updateMockDataFile.js';

function mockDataSyncPlugin() {
  return {
    name: 'seller-mock-data-sync-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        if (req.url === '/api/sync-data' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          const syncState = getSyncState();
          res.statusCode = 200;
          return res.end(JSON.stringify(syncState));
        }

        if ((req.url === '/api/save-mock-data' || req.url === '/api/sync-data') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const result = updateMockDataFile(payload);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, revision: result.revision, message: 'Seller mockData sync completed across portals' }));
            } catch (err) {
              console.error('Error saving mock data in seller:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    mockDataSyncPlugin()
  ],
  server: {
    port: 5174,
    strictPort: false,
    watch: {
      ignored: ['**/src/data/mockData.js', '**/src/data/.seller_sync.json', '**/.platform_sync.json', '**/src/data/**']
    }
  }
});
