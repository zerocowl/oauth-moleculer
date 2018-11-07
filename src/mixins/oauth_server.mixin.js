import Repository from './repository.mixin';
import { Request, Response } from 'oauth2-server';
const OAuth2Server = require('oauth2-server');
const oauthAccessTokenRepository = new Repository('OAuthAccessToken');
const oauthAuthorizationCodeRepository = new Repository('OAuthAuthorizationCode');
const oauthClientRepository = new Repository('OAuthClient');
const oauthRefreshTokenRepository = new Repository('OAuthRefreshToken');
const userRepository = new Repository('User');

class OAuthServer {
  constructor() {
    const self = this;
    self.name = '';
    self.model = {
      getAccessToken: self.getAccessToken,
      getAuthorizationCode: self.getAuthorizationCode,
      getClient: self.getClient,
      getRefreshToken: self.getRefreshToken,
      getUser: self.getUser,
      getUserFromClient: self.getUserFromClient,
      revokeAuthorizationCode: self.revokeAuthorizationCode,
      revokeToken: self.revokeToken,
      saveToken: self.saveToken,
      saveAuthorizationCode: self.saveAuthorizationCode
    };
    self.oauth = new OAuth2Server({
      model: self.model,
      grants: ['refresh_token', 'client_credentials', 'password'],
      accessTokenLifetime: 60 * 60 * 24,
      allowBearerTokensInQueryString: true
    });
    self.methods = {
      GETAuthorize: self.GETAuthorize,
      POSTAuthorize: self.POSTAuthorize,
      authorize: self.authenticate,
      token: self.token
    };
    self.settings = {
      oauthModel: self.model,
      oauth: self.oauth
    };
  }

  async authenticate(ctx, route, req, res) {
    const request = new Request(req);
    const response = new Response(res);
    try {
      const token = await this.settings.oauth.authenticate(request, response, {});
      ctx.meta.user = token.user.get({ plain: true });
      return token;
    } catch (err) {
      ctx.meta.$statusCode = 401;
      throw err;
    }
  }

  POSTAuthorize(req, res) {
    let request = new Request({
      headers: { authorization: req.headers.authorization },
      method: req.method,
      query: req.query,
      body: req.body,
      params: req.params
    });
    let response = new Response(res);
    return this.settings.oauth
      .authorize(request, response)
      .then(success => {
        return res.status(200).send(success);
      })
      .catch(err => {
        return res.status(401).send(err);
      });
  }

  GETAuthorize(req, res) {
    const { model } = oauthClientRepository.settings;
    return model
      .findOne({
        where: {
          client_id: req.query.client_id,
          redirect_uri: req.query.redirect_uri
        },
        attributes: ['id', 'name']
      })
      .then(model => {
        if (!model) return res.status(404).json({ error: 'Invalid Client' });
        return res.status(200).send(model);
      })
      .catch(err => {
        return res.status(401).send(err);
      });
  }

  async token(req, res) {
    let request = new Request(req);
    let response = new Response(res);
    try {
      const token = await this.settings.oauth.token(request, response);
      res.status = 200;
      res.end(JSON.stringify(token));
    } catch (err) {
      res.status = 401;
      res.end(JSON.stringify(err));
      // throw err;
    }
  }

  /**
   *
   * @param {bearerToken} string
   */
  async getAccessToken(bearerToken) {
    const { model } = oauthAccessTokenRepository.settings;
    try {
      const token = await model.findOne({
        where: {
          access_token: bearerToken
        }
      });
      if (!token) return;
      return {
        accessToken: token.access_token,
        accessTokenExpiresAt: new Date(token.expires),
        client: {
          id: token.clientId
        },
        expires: token.expires,
        user: await token.getUser({
          attributes: ['id', 'msisdn', 'email']
        })
      };
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   * @param {clientId} string
   * @param {clientSecret} string
   */
  getClient(clientId, clientSecret) {
    const { model } = oauthClientRepository.settings;
    const options = {
      where: { client_id: clientId },
      attributes: ['id', 'client_id', 'redirect_uri', 'scope']
    };
    if (clientSecret) options.where.client_secret = clientSecret;

    return model
      .findOne(options)
      .then(client => {
        if (!client) return new Error('client not found');
        let clientWithGrants = client.toJSON();
        clientWithGrants.grants = [
          'authorization_code',
          'password',
          'refresh_token',
          'client_credentials'
        ];
        clientWithGrants.redirectUris = [clientWithGrants.redirect_uri];
        delete clientWithGrants.redirect_uri;
        return clientWithGrants;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param {username} string
   * @param {password} string
   */
  async getUser(username, password) {
    const { repository: db } = userRepository.settings;
    const { Op } = db.Sequelize;
    try {
      const user = await db.User.findOne({
        where: { [Op.or]: [{ email: username }, { msisdn: username }] }
      });
      if (!user) throw new Error(`User not found, ${username}`);
      if (!user.verifyPassword(password)) throw new Error('Incorrect Password');
      return user;
    } catch (err) {
      throw err;
    }
  }

  /**
   *
   * @param {code} string
   */
  revokeAuthorizationCode(code) {
    const { model } = oauthAuthorizationCodeRepository.settings;
    return model
      .findOne({
        where: {
          authorization_code: code.code
        }
      })
      .then(rCode => {
        let expiredCode = code;
        expiredCode.expiresAt = new Date('2018-11-28T06:59:53.000Z'); // TODO data expired
        return expiredCode;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param {token} string
   */
  revokeToken(token) {
    const { model } = oauthRefreshTokenRepository.settings;
    return model
      .findOne({
        where: {
          refresh_token: token.refreshToken
        }
      })
      .then(rT => {
        if (rT) rT.destroy();
        let expiredToken = token;
        expiredToken.refreshTokenExpiresAt = new Date('2018-11-28T06:59:53.000Z'); // TODO data expired
        return expiredToken;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param {token} string
   * @param { client} string
   * @param {user} string
   */
  saveToken(token, client, user) {
    const { model: accessToken } = oauthAccessTokenRepository.settings;
    const { model: refreshToken } = oauthRefreshTokenRepository.settings;

    return Promise.all([
      accessToken.create({
        access_token: token.accessToken,
        expires: token.accessTokenExpiresAt,
        client_id: client.id,
        user_id: user.id,
        scope: token.scope
      }),
      token.refreshToken
        ? refreshToken.create({
            refresh_token: token.refreshToken,
            expires: token.refreshTokenExpiresAt,
            client_id: client.id,
            user_id: user.id,
            scope: token.scope
          })
        : []
    ])
      .then(resultsArray => {
        return Object.assign(
          {
            client: client,
            user: user,
            access_token: token.accessToken,
            refresh_token: token.refreshToken
          },
          token
        );
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param {code} string
   */
  getAuthorizationCode(code) {
    const { model, repository: db } = oauthAuthorizationCodeRepository.settings;
    return model
      .findOne({
        attributes: ['client_id', 'expires', 'user_id', 'scope'],
        where: { authorization_code: code },
        include: [db.User, db.OAuthClient]
      })
      .then(authCodeModel => {
        if (!authCodeModel) return false;
        let client = authCodeModel.OAuthClient.toJSON();
        let user = authCodeModel.User.toJSON();
        let reCode = {
          code: code,
          client: client,
          expiresAt: authCodeModel.expires,
          redirectUri: client.redirect_uri,
          user: user,
          scope: authCodeModel.scope
        };
        return reCode;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param {code} string
   * @param {client} string
   * @param {user} string
   */
  saveAuthorizationCode(code, client, user) {
    const { model } = oauthAuthorizationCodeRepository.settings;
    return model
      .create({
        expires: code.expiresAt,
        client_id: client.id,
        authorization_code: code.authorizationCode,
        user_id: user.id,
        scope: code.scope
      })
      .then(() => {
        code.code = code.authorizationCode;
        return code;
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param {client} string
   */
  getUserFromClient(client) {
    const { model, repository: db } = oauthClientRepository.settings;
    let options = {
      where: { client_id: client.client_id },
      include: [db.User],
      attributes: ['id', 'client_id', 'redirect_uri', 'scope']
    };
    if (client.client_secret) options.where.client_secret = client.client_secret;

    return model
      .findOne(options)
      .then(client => {
        if (!client) return false;
        if (!client.User) return false;
        return client.User.toJSON();
      })
      .catch(err => {
        throw err;
      });
  }

  /**
   *
   * @param {refreshToken} string
   */
  getRefreshToken(refreshToken) {
    const { model, repository: db } = oauthRefreshTokenRepository.settings;
    if (!refreshToken || refreshToken === 'undefined') return false;

    return model
      .findOne({
        attributes: ['client_id', 'user_id', 'expires'],
        where: { refresh_token: refreshToken },
        include: [db.OAuthClient, db.User]
      })
      .then(savedRT => {
        var tokenTemp = {
          user: savedRT ? savedRT.User.toJSON() : {},
          client: savedRT ? savedRT.OAuthClient.toJSON() : {},
          refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
          refreshToken: refreshToken,
          refresh_token: refreshToken,
          scope: savedRT.scope
        };
        return tokenTemp;
      })
      .catch(err => {
        throw err;
      });
  }
  // TODO add validate scope
  validateScope(token, client, scope) {
    return token.scope === scope && client.scope === scope && scope !== null ? scope : false;
  }

  verifyScope(token, scope) {
    return token.scope === scope;
  }
}

export default OAuthServer;
