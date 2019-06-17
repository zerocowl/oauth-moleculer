## OAuth2 Server + MoleculerJS

This project is an example of how to implement OAuth2 Server with MoleculerJS, I pretend to convert this into a module of MoleculerJS in the future.

The main project’s file is the `oauth_server.mixin.js`, I have the methods of OAuth Server into it and I've implemented the `authenticate` which will be inserted into the API Gateway and will be basically the authentication method, after that I can protect, or not, an API endpoint using the option `authorization`.

## Getting started
```
npm run clear
npm run seeders
```
_Import the collection for your Postman and enjoy_


## References: 
https://github.com/dsquier/oauth2-server-php-mysql  
https://github.com/manjeshpv/node-oauth2-server-implementation  
https://moleculer.services/docs/0.13/moleculer-web.html#Authentication


