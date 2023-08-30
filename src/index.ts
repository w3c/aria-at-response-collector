import type QueryString from 'qs';
import express from 'express';

import createWorkOrder from './create-work-order';
import {rateLimitInfo} from './fetch-gh';

const app = express();
const port = 8000;

const makeResult = (query: QueryString.ParsedQs) => {
  if (query.result === 'success') {
    const workflowRunInfo = typeof query.id === 'string' ?
      `workflow ID: ${query.id}` : 'no workflow ID found';
    return `<div>Success! (${workflowRunInfo})</div>`;
  } else if (query.result === 'failure') {
    if (typeof query.reason !== 'string') {
      return '<div>Unknown error.</div>';
    }

    return `<div>Error: ${atob(query.reason)}</div>`;
  }
  return '';
};

app.get('/', (req, res) => {
  const result = makeResult(req.query);

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
  ${result}
  <form method="post" action="/go">
    <input type="submit" value="Go" />
  </form>
<!--
${JSON.stringify(rateLimitInfo(), null, 2)}
-->
</body>
</html>
`);
});

app.post('/go', async (req, res) => {
  try {
    const workflowId = await createWorkOrder();
    res.redirect(`/?result=success&id=${workflowId}`);
  } catch (err) {
    res.redirect(`/?result=failure&reason=${btoa(String(err))}`);
  }
});

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
