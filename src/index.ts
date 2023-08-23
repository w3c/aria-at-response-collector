import type QueryString from 'qs';
import express from 'express';

import createWorkOrder from './create-work-order';

const app = express();
const port = 8000;

const makeError = (query: QueryString.ParsedQs) => {
  if (query.result !== 'failure') {
    return null;
  }

  if (typeof query.reason !== 'string') {
    return '<div>Unknown error.</div>';
  }

  return `<div>${atob(query.reason)}</div>`;
};

app.get('/', (req, res) => {
  const error = makeError(req.query);

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  ${error}
  <form method="post" action="/go">
    <input type="submit" value="Go" />
  </form>
</body>
</html>
`);
});

app.post('/go', async (req, res) => {
  try {
    await createWorkOrder();
    res.redirect('/?result=success');
  } catch (err) {
    res.redirect(`/?result=failure&reason=${btoa(err)}`);
  }
});

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
