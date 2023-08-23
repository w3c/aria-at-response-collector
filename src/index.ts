import express from 'express';

import createWorkOrder from './create-work-order';

const app = express();
const port = 8000;


app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
</head>
<body>
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
  } catch ({}) {
    res.redirect('/?result=failure');
  }
});

app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
