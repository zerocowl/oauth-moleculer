'use strict';
import ApiGateway from 'moleculer-web';
import OAuthServer from '../mixins/oauth_server.mixin';
import { UAParser } from 'ua-parser-js';
const parser = new UAParser();
module.exports = {
  name: 'api',

  mixins: [ApiGateway, new OAuthServer()],

  settings: {
    assets: {
      folder: 'public'
    },

    callOptions: {
      timeout: 3000
    },

    cors: {
      origin: '*',
      methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'DELETE', 'HEAD'],
      allowedHeaders: '*',
      exposedHeaders: '*',
      credentials: false,
      maxAge: null
    },

    port: process.env.PORT || 3000,

    rateLimit: {
      window: 10 * 1000,
      limit: 10,
      headers: true
    },

    routes: [
      {
        path: '/oauth',
        aliases: {
          'GET authorise'(req, res) {
            this.GETAuthorize(req, res);
          },
          'POST authorise'(req, res) {
            this.POSTAuthorize(req, res);
          },
          'POST token'(req, res) {
            return this.token(req, res);
          }
        },
        bodyParsers: {
          json: true,
          urlencoded: {
            extended: true
          }
        }
      },
      {
        path: '/v1/',
        authorization: true,
        aliases: {
          'GET users': 'user.list'
        },

        bodyParsers: {
          json: true,
          urlencoded: {
            extended: true
          }
        },

        async onAfterCall(ctx, route, req, res, data) {
          res.setHeader('X-Response-Type', typeof data);
          return data;
        },

        async onBeforeCall(ctx, route, req, res) {
          ctx.meta.userAgent = parser.setUA(req.headers['user-agent']).getResult();
        }
      },
      {
        path: '/admin',
        roles: ['admin'],
        whitelist: ['user.*', '$node.*'],
        authorization: true,
        aliases: {
          health: '$node.health',
          custom(req, res) {
            res.writeHead(201);
            res.end(JSON.stringify({ as: 23123 }));
          }
        }
      }
    ]
  },
  methods: {},
  events: {
    'node.broken'(node) {
      this.logger.warn(`The ${node.id} node is disconnected!`);
    }
  }
};
