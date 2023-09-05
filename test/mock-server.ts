import {createServer} from 'node:http';
import type {ClientRequest as Request, ServerResponse as Response, Server} from 'node:http';
import {Observable} from 'rxjs';

export interface ExpectedEvent {
    server: MockServer;
    path: string;
    responseBody: string;
}

interface RequestEvent {
  request: Request;
  response: Response;
}

export default class MockServer {
  name: string;
  server: Server;
  observable: Observable<RequestEvent>;

  constructor(name: string) {
    this.name = name;
    this.server = createServer();

    this.observable = new Observable((subscriber) => {
      const onRequest = (data: RequestEvent) => {
        subscriber.next(data);
      };
      const onClose = () => subscriber.complete();

      if (!this.server.listening) {
        throw new Error('Cannot subscribe: MockServer is not listening');
      }

      this.server.on('request', onRequest);
      this.server.on('close', onClose);

      return () => {
        this.server.off('request', onRequest);
        this.server.off('close', onClose);
      };
    });
  }

  expect(path: string, responseBody: string): ExpectedEvent {
    return { server: this, path, responseBody };
  }

  listen(port: number): Promise<void> {
    return new Promise((resolve) => this.server.listen(port, resolve));
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((error) => {
        error ? reject(error) : resolve();
      });
    });
  }
}
