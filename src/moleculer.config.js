import { JoiValidator } from './libs/joi.validator';

export default {
  namespace: 'oauth-api',
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
  metrics: true,
  validation: true,
  validator: new JoiValidator()
};
