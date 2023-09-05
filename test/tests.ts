import { EventEmitter } from 'node:events';
import { Observable, of, lastValueFrom, map, merge, timeout, zip } from 'rxjs';

import MockServer from './mock-server';
import type {ExpectedEvent} from './mock-server';
import createAppServer from '../src/server';

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

const github = new MockServer('github');
const ariaAT = new MockServer('ariaAT');
let app: null | ReturnType<typeof createAppServer> = null;

suite('things', () => {

  setup(() => {
    app = createAppServer();

    return Promise.all([
      github.listen(3001),
      ariaAT.listen(3002),
      app.listen(3003),
    ]);
  });

  teardown(async () => {
    await Promise.all([
      github.close(),
      ariaAT.close(),
      app && app.close(),
    ]);

    app = null;
  });

  test('stuff', async () => {
    const x = run([
      github.expect('/push', 'ok'),
      github.expect('/runs', 'none'),
      github.expect('/runs', 'none'),
      github.expect('/runs', 'a new run'),
      ariaAT.expect('/job', 'ok'),

      github.expect('/runs/{ID}/log', 'an empty log'),
      github.expect('/runs/{ID}/log', 'a log with one test complete'),
      ariaAT.expect('/job', 'ok'),

      github.expect('/runs/{ID}/log', 'a log with one test complete'),
      github.expect('/runs/{ID}/log', 'a log with two tests complete'),
      ariaAT.expect('/job', 'ok'),
    ]);
    //await send(me, '/go');
    return x;
  });
});

const run = (expected: ExpectedEvent[]) => {
  const chain = zip(
      merge(github.observable, ariaAT.observable),
      of(...expected)
    ).pipe(
      map(([actual, expectedEvent]) => {
        console.log('actual:', actual);
        console.log('expectedEvent:', expectedEvent);
        actual.response.end(expectedEvent.responseBody);
        //compare actual and expected
      })
    ).pipe(timeout(1000))
  return lastValueFrom(chain);
};
