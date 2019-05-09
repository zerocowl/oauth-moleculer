'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('oauth_scopes', [
      {
        scope: 'profile',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        scope: 'admin',
        is_default: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('oauth_scopes', null, {});
  }
};
