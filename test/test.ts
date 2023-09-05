suite('things', () => {
  test('stuff', () => {

    fetch('/go');

    return run([
      github.expect('/push')
        .then(() => github.send('ok')),
      github.expect('/runs')
        .then(() => github.send('none')),
      github.expect('/runs')
        .then(() => github.send('none')),
      github.expect('/runs')
        .then(() => github.send('a new run')),
      app.expect('/job'),

      github.expect('/runs/{ID}/log')
        .then(() => github.send('an empty log'),
      github.expect('/runs/{ID}/log')
        .then(() => github.send('a log with one test complete'),
      app.expect('/job'),

      github.expect('/runs/{ID}/log')
        .then(() => github.send('a log with one test complete'),
      github.expect('/runs/{ID}/log')
        .then(() => github.send('a log with two tests complete'),
      app.expect('/job'),
    ]);
  });
});

const run = (expected) => {
  return zip(
    merge(github, app),
    of(expected),
    ([actual, expected]) => {
      compare actual and expected
    }
  );
};
