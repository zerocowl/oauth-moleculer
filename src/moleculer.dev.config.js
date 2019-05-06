export default {
  namespace: 'oauth-api',
  transporter: 'TCP',
  logger: true,
  logLevel: 'info',
  logFormatter: 'short',
  cacher: {
    type: 'memory',
    options: {
      maxParamsLength: 100
    }
  }
};
