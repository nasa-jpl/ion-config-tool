import * as http from 'http';
import * as url from 'url';

interface ResponseData<T> {
  items: T[];
  next_page_token: string | null;
}

const MOCK_HOSTS = [
  { hostname: 'host1', ip: '192.168.1.101', host_id: 'host1' },
  { hostname: 'host2', ip: '192.168.1.102', host_id: 'host2' },
  { hostname: 'host3', ip: '192.168.1.103', host_id: 'host3' },
];

// The registry identifies a node by `node_id` and serves no `id` field at
// all. Naming it `id` here let the editor read an identifier the real
// registry never sends, so every per-node sub-request silently went to
// /nodes/undefined/... against a live server while these tests still passed.
// Keep these field names matched to the registry's response schema.
const MOCK_NODES = [
  { node_id: 'node1', node_number: 1, node_name: 'node1', host: { hostname: 'host1', host_id: 'host1' } },
  { node_id: 'node2', node_number: 2, node_name: 'node2', host: { hostname: 'host2', host_id: 'host2' } },
  { node_id: 'node3', node_number: 3, node_name: 'node3', host: { hostname: 'host3', host_id: 'host3' } },
];

const MOCK_DESTINATIONS: Record<string, any[]> = {
  host1: [{ id: 'dest1', destination_value: '192.168.1.101' }],
  host2: [{ id: 'dest2', destination_value: '192.168.1.102' }],
  host3: [{ id: 'dest3', destination_value: '192.168.1.103' }],
};

const MOCK_PROTOCOLS: Record<string, any[]> = {
  node1: [{ id: 'prot1', cl_protocol_name: 'tcp' }],
  node2: [{ id: 'prot2', cl_protocol_name: 'tcp' }],
  node3: [{ id: 'prot3', cl_protocol_name: 'tcp' }],
};

const MOCK_INDUCTS: Record<string, any[]> = {
  node1: [{ id: 'ind1', name: 'Induct 1', cl_protocol: { cl_protocol_name: 'tcp' }, duct_name: { port_number: 5000 } }],
  node2: [{ id: 'ind2', name: 'Induct 2', cl_protocol: { cl_protocol_name: 'tcp' }, duct_name: { port_number: 5001 } }],
  node3: [{ id: 'ind3', name: 'Induct 3', cl_protocol: { cl_protocol_name: 'tcp' }, duct_name: { port_number: 5002 } }],
};

export class MockServer {
  private server: http.Server | null = null;
  private readonly port = 8000;

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url || '/', true);
        const pathname = parsedUrl.pathname || '/';
        const query = parsedUrl.query;

        // Handle query parameters (max_page_size and page_token)
        // Since data is small, we ignore max_page_size and return null for page_token
        const pageToken = query.page_token || null;

        // Handle CORS preflight requests
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        let items: any[] | undefined;

        if (pathname === '/api/hosts') {
          items = MOCK_HOSTS;
        } else if (pathname === '/api/nodes') {
          items = MOCK_NODES;
        } else if (pathname.startsWith('/api/hosts/') && pathname.endsWith('/destinations')) {
          items = MOCK_DESTINATIONS[pathname.split('/')[3]];
        } else if (pathname.startsWith('/api/nodes/') && pathname.endsWith('/cl-protocols')) {
          items = MOCK_PROTOCOLS[pathname.split('/')[3]];
        } else if (pathname.startsWith('/api/nodes/') && pathname.endsWith('/inducts')) {
          items = MOCK_INDUCTS[pathname.split('/')[3]];
        }

        // An unknown path and an unknown host/node id both answer the way the
        // registry does: 404 carrying a problem-details body with no `items`.
        // Answering a well-formed empty envelope instead would mask how the
        // editor copes with a bad sub-resource URL -- it would read zero rows
        // and carry on rather than failing -- and that is precisely the
        // failure this fixture exists to surface.
        const page: ResponseData<any> | null =
          items === undefined ? null : { items, next_page_token: null };
        const statusCode = page === null ? 404 : 200;
        const responseBody = page ?? { status_code: 404, detail: 'Not Found' };

        // Set CORS headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.writeHead(statusCode);
        res.end(JSON.stringify(responseBody));
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.listen(this.port, () => {
        console.log(`Mock server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Start the server when this script is run directly
const server = new MockServer();
server.start().catch((err) => {
  console.error('Failed to start mock server:', err);
  process.exit(1);
});
