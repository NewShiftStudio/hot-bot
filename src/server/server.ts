import express from 'express';

export const app = express();

const port = process.env.PORT || 3000;

export const server = app.listen(port, () => {
  console.log(`User bot working on http://localhosh:${port}`);
});

process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());
