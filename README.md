## OAuth2 Server + MoleculerJS

Esse projeto é uma exemplo de como implementar OAuth2 Server com MoleculerJS, no futuro pretendo converter isso para um módulo do MoleculerJS.

A base do projeto é um  banco de dados(mysql) e o `repository.mixin.js` que é  basicamente um *moleculer-db-adapter*, criei ele pois tive algumas dificuldades em trabalhar com muitas entidades usando o `moleculer-db`, mas em resumo ele tem o mesmo proposito.

O principal arquivo do projeto é o `oauth_server.mixin.js`, nele eu tenho os métodos do OAuth Server e implemento o `authenticate` que será injetado no API Gateway e basicamente será nosso método de autenticação, depois usando a opcao `authorization` eu posso proteger ou nao um endpoint da minha API.

## Getting started
```
npm run clear
npm run seeders
```

Import the collection for your Postman and enjoy

## References: 
https://github.com/dsquier/oauth2-server-php-mysql  
https://github.com/manjeshpv/node-oauth2-server-implementation  
https://moleculer.services/docs/0.13/moleculer-web.html#Authentication  


