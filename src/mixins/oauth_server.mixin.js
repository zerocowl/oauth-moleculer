const OAuth2Server = require('oauth2-server');
const { Request, Response } = OAuth2Server;
const { MoleculerError } = require('moleculer').Errors;

module.exports = {
  methods: {
    async authenticate(req, res) {
      let request = new Request(req);
      let response = new Response(res);
      try {
        const token = await this.oauth.token(request, response);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.writeHead(200);
        res.end(JSON.stringify(token));
      } catch (err) {
        this.logger.error(err);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.writeHead(401);
        res.end(JSON.stringify(err));
      }
    },

    async authorize(ctx, route, req, res) {
      const request = new Request(req);
      const response = new Response(res);
      try {
        const token = await this.oauth.authenticate(request, response);
        ctx.meta.user = token.user.get({ plain: true });
        return token;
      } catch (err) {
        this.logger.error(err);
        ctx.meta.$statusCode = 401;
        throw err;
      }
    },

    async getAccessToken(bearerToken) {
      const db = this.db;
      try {
        const token = await db.OAuthAccessToken.findOne({
          where: { access_token: bearerToken }
        });
        if (!token) return;
        return {
          accessToken: token.access_token,
          accessTokenExpiresAt: new Date(token.expires),
          client: {
            id: token.clientId
          },
          user: await token.getUser({
            attributes: ['id', 'msisdn', 'email', 'scope']
          }),
          scope: [token.scope]
        };
      } catch (err) {
        this.logger.error(err);
        throw err;
      }
    },

    async getClient(id, secret) {
      const db = this.db;
      try {
        let client = await db.OAuthClient.findOne({
          where: {
            client_id: id,
            client_secret: secret
          },
          attributes: ['id', 'client_id', 'redirect_uri', 'scope']
        });
        if (!client) throw new Error('Client not found');
        client = client.get({ plain: true });
        client.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials'];
        client.redirectUris = [client.redirect_uri];
        delete client.redirect_uri;
        return client;
      } catch (err) {
        this.logger.error(err);
        throw err;
      }
    },

    async getUser(username, password) {
      const db = this.db;
      const { Op } = db.Sequelize;
      try {
        let email = username;
        let msisdn = username;
        if (msisdn.length < 13) msisdn = '55'.concat(msisdn);
        const user = await db.User.scope('oauth').findOne({
          where: {
            [Op.or]: [{ msisdn }, { email }]
          }
        });
        if (!user) throw new MoleculerError(`User not found, ${username}`, 404);
        if (!user.password) throw new MoleculerError('User does not have password', 400);
        if (!user.verifyPassword(password)) {
          throw new MoleculerError('Incorrect password', 400);
        }
        return user;
      } catch (err) {
        this.logger.error(err);
        throw err;
      }
    },

    async revokeToken(token) {
      const db = this.db;
      try {
        let refreshToken = await db.OAuthRefreshToken.findOne({
          where: { refresh_token: token.refreshToken }
        });
        if (!refreshToken) throw new Error('Refresh Token not found');
        return refreshToken.destroy();
      } catch (err) {
        this.logger.error(err);
        throw err;
      }
    },

    async saveToken(token, client, user) {
      const db = this.db;
      try {
        this.logger.info(token);
        const accessToken = await db.OAuthAccessToken.create({
          access_token: token.accessToken,
          client_id: client.id,
          expires: token.accessTokenExpiresAt,
          user_id: user.id,
          scope: token.scope
        });
        let refreshToken = null;
        if (token.refreshToken) {
          refreshToken = await db.OAuthRefreshToken.create({
            refresh_token: token.refreshToken,
            expires: token.refreshTokenExpiresAt,
            client_id: client.id,
            user_id: user.id,
            scope: token.scope
          });
        }
        return {
          ...token,
          client: client,
          user: user,
          access_token: accessToken.access_token,
          refresh_token: refreshToken.refresh_token
        };
      } catch (err) {
        this.logger.error(err);
        throw err;
      }
    },

    async getRefreshToken(token) {
      const db = this.db;
      if (!token || token === 'undefined') return false;
      try {
        const refreshToken = await db.OAuthRefreshToken.findOne({
          attributes: [
            'client_id',
            'user_id',
            ['expires', 'refreshTokenExpiresAt'],
            ['refresh_token', 'refreshToken'],
            'scope'
          ],
          where: { refresh_token: token },
          include: ['client', 'user']
        });
        return refreshToken.get({ plain: true });
      } catch (err) {
        this.logger.error(err);
        throw err;
      }
    },

    validateScope(user, client, scope) {
      if (user.scope.some(i => i === scope) && client.scope.split(', ').some(i => i === scope)) {
        return scope;
      }
    }
  },

  async created() {
    this.db = require('../repository');
    this.oauth = new OAuth2Server({
      model: {
        getAccessToken: this.getAccessToken,
        getClient: this.getClient,
        getRefreshToken: this.getRefreshToken,
        getUser: this.getUser,
        revokeToken: this.revokeToken,
        saveToken: this.saveToken,
        validateScope: this.validateScope
      },
      grants: ['refresh_token', 'client_credentials', 'password']
    });
  }
};
