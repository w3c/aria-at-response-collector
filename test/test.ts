import { EventEmitter } from 'node:events';
import { Observable, of, lastValueFrom, map, merge, timeout, zip } from 'rxjs';

interface Request {
	path: string;
}
interface Response {
	send: (responseBody: string) => void
}
interface ActualEvent {
	request: Request;
	response: Response;
}

class Server extends EventEmitter {
	observable: Observable<ActualEvent>;

	constructor() {
		super();
		this.observable = new Observable((subscriber) => {
			this.on('request', ({request, response}) => {
				subscriber.next({request, response});
			});
			this.on('close', () => subscriber.complete());
		});
	}

	expect(path: string, responseBody: string): ExpectedEvent {
		return { server: this, path, responseBody };
	}
}

interface ExpectedEvent {
	server: Server;
	path: string;
	responseBody: string;
}

const me = new Server();
me.on('request', () => {
	send(github, 'foo');
});
const github = new Server();
const app = new Server();

const send = (server: Server, path: string) => {
	return new Promise((resolve) => {
	  server.emit('request', {request: {path}, response: {send: resolve}});
	});
};

suite('things', () => {
  test('stuff', async () => {
    const x = run([
      github.expect('/push', 'ok'),
      github.expect('/runs', 'none'),
      github.expect('/runs', 'none'),
      github.expect('/runs', 'a new run'),
      app.expect('/job', 'ok'),

      github.expect('/runs/{ID}/log', 'an empty log'),
      github.expect('/runs/{ID}/log', 'a log with one test complete'),
      app.expect('/job', 'ok'),

      github.expect('/runs/{ID}/log', 'a log with one test complete'),
      github.expect('/runs/{ID}/log', 'a log with two tests complete'),
      app.expect('/job', 'ok'),
    ]);
    await send(me, '/go');
	return x;
  });
});

const run = (expected: ExpectedEvent[]) => {
  const chain = zip(
      merge(github.observable, app.observable),
      of(...expected)
    ).pipe(
      map(([actual, expectedEvent]) => {
		console.log('actual:', actual);
		console.log('expectedEvent:', expectedEvent);
		actual.response.send(expectedEvent.responseBody);
        //compare actual and expected
      })
    ).pipe(timeout(1000))
  return lastValueFrom(chain);
};
