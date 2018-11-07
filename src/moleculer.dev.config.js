export default {
  namespace: 'core-api',
  transporter: 'NATS',
  logger: true,
  logLevel: 'info',
  logFormatter: 'short',
  cacher: {
    type: 'memory',
    options: {
      maxParamsLength: 100
    }
  },
  metrics: true
};
