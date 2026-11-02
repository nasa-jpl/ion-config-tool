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

const MOCK_NODES = [
  { id: 'node1', node_number: 1, node_name: 'node1', host: { hostname: 'host1', host_id: 'host1' } },
  { id: 'node2', node_number: 2, node_name: 'node2', host: { hostname: 'host2', host_id: 'host2' } },
  { id: 'node3', node_number: 3, node_name: 'node3', host: { hostname: 'host3', host_id: 'host3' } },
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

        let responseBody: ResponseData<any> = { items: [], next_page_token: null };
        let statusCode = 200;

        if (pathname === '/api/hosts') {
          responseBody.items = MOCK_HOSTS;
        } else if (pathname === '/api/nodes') {
          responseBody.items = MOCK_NODES;
        } else if (pathname?.startsWith('/api/hosts/') && pathname.endsWith('/destinations')) {
          const hostId = pathname.split('/')[3];
          responseBody.items = MOCK_DESTINATIONS[hostId] || [];
        } else if (pathname?.startsWith('/api/nodes/') && pathname.endsWith('/cl-protocols')) {
          const nodeId = pathname.split('/')[3];
          responseBody.items = MOCK_PROTOCOLS[nodeId] || [];
        } else if (pathname?.startsWith('/api/nodes/') && pathname.endsWith('/inducts')) {
          const nodeId = pathname.split('/')[3];
          responseBody.items = MOCK_INDUCTS[nodeId] || [];
        } else {
          statusCode = 404;
          responseBody = { items: [], next_page_token: null };
        }

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
