'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('oauth_clients', [
      {
        client_id: 'website',
        client_secret: 'secretsite',
        created_at: new Date(),
        grant_types: 'password',
        name: 'web',
        redirect_uri: '0.0.0.0',
        scope: 'admin',
        updated_at: new Date()
      },
      {
        client_id: 'mobile',
        client_secret: 'secretmobile',
        created_at: new Date(),
        grant_types: 'password',
        name: 'mobile',
        redirect_uri: 'http://localhost/cb',
        scope: 'mobile',
        updated_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('oauth_clients', null, {});
  }
};
