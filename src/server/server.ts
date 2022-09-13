import express from 'express';

import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

export const app = express();

const port = process.env.PORT || 3000;

Sentry.init({
  dsn: 'https://8cd43a1184ae4ca9928908f3990de9de@o1396983.ingest.sentry.io/6740056',
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(Sentry.Handlers.errorHandler());

export const server = app.listen(port, () => {
  console.log(`User bot working on http://localhosh:${port}`);
});

process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());
