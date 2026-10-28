import * as http from 'http';
import * as url from 'url';

interface ResponseData<T> {
  items: T[];
  next_page_token: string | null;
}

const MOCK_HOSTS = [
  { id: 'host1', ip: '192.168.1.101' },
  { id: 'host2', ip: '192.168.1.102' },
  { id: 'host3', ip: '192.168.1.103' },
];

const MOCK_NODES = [
  { id: 'node1', node_number: 1, host_id: 'host1' },
  { id: 'node2', node_number: 2, host_id: 'host2' },
  { id: 'node3', node_number: 3, host_id: 'host3' },
];

const MOCK_DESTINATIONS: Record<string, any[]> = {
  host1: [{ id: 'dest1', name: 'Destination 1' }],
  host2: [{ id: 'dest2', name: 'Destination 2' }],
  host3: [{ id: 'dest3', name: 'Destination 3' }],
};

const MOCK_PROTOCOLS: Record<string, any[]> = {
  node1: [{ id: 'prot1', name: 'Protocol 1' }],
  node2: [{ id: 'prot2', name: 'Protocol 2' }],
  node3: [{ id: 'prot3', name: 'Protocol 3' }],
};

const MOCK_INDUCTS: Record<string, any[]> = {
  node1: [{ id: 'ind1', name: 'Induct 1' }],
  node2: [{ id: 'ind2', name: 'Induct 2' }],
  node3: [{ id: 'ind3', name: 'Induct 3' }],
};

export class MockServer {
  private server: http.Server | null = null;
  private readonly port = 8000;

  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url || '/', true);
        const pathname = parsedUrl.pathname || '/';
        const query = parsedUrl.searchParams || parsedUrl.query;

        // Handle query parameters (max_page_size and page_token)
        // Since data is small, we ignore max_page_size and return null for page_token
        const pageToken = query.page_token || null;

        let responseBody: ResponseData<any> = { items: [], next_page_token: null };
        let statusCode = 200;

        if (pathname === '/api/hosts') {
          responseBody.items = MOCK_HOSTS;
        } else if (pathname === '/api/nodes') {
          responseBody.items = MOCK_NODES;
        } else if (pathname?.startsWith('/hosts/') && pathname.endsWith('/destinations')) {
          const hostId = pathname.split('/')[2];
          responseBody.items = MOCK_DESTINATIONS[hostId] || [];
        } else if (pathname?.startsWith('/nodes/') && pathname.endsWith('/cl-protocols')) {
          const nodeId = pathname.split('/')[2];
          responseBody.items = MOCK_PROTOCOLS[nodeId] || [];
        } else if (pathname?.startsWith('/nodes/') && pathname.endsWith('/inducts')) {
          const nodeId = pathname.split('/')[2];
          responseBody.items = MOCK_INDUCTS[nodeId] || [];
        } else {
          statusCode = 404;
          responseBody = { items: [], next_page_token: null };
        }

        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
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
