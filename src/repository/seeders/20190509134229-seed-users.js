'use strict';
const { hashSync } = require('bcryptjs');

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert('users', [
      {
        created_at: new Date(),
        active: true,
        email: 'admin2@oauth.com.br',
        msisdn: '5511900000000',
        password: hashSync('$@dmin$', 10),
        updated_at: new Date()
      },
      {
        created_at: new Date(),
        email: 'admin@oauth.com',
        msisdn: '5511961161212',
        password: hashSync('$@dmin$', 10),
        updated_at: new Date()
      }
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
};
