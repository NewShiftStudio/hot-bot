import express from 'express';

import * as Sentry from '@sentry/node';
import * as Tracing from '@sentry/tracing';

export const app = express();

const port = process.env.PORT || 3000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());
app.use(Sentry.Handlers.errorHandler());

export const server = app.listen(port, () => {
  console.log(`User bot working on http://localhosh:${port}`);
});

process.once('SIGINT', () => server.close());
process.once('SIGTERM', () => server.close());
