const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(4001, () => {
  console.log('Test server running on port 4001');
}); 