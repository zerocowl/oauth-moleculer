const Service = {
  name: 'user',

  actions: {
    create(ctx) {
      const db = this.db;
      return db.User.create(ctx.params);
    },

    findById(ctx) {
      const db = this.db;
      return db.User.findByPk(ctx.params.id);
    },

    list() {
      const db = this.db;
      return db.User.findAndCountAll();
    },

    async exists(ctx) {
      const { model } = this.settings;
      const { msisdn, cpf, email } = ctx.params;
      let query = {};
      if (msisdn) query = { msisdn: msisdn };
      if (cpf) query = { cpf: cpf };
      if (email) query = { email: email };
      const count = await model.count({ where: query });
      const result = count > 0;
      ctx.meta.$statusCode = result ? 409 : 200;
      return result;
    }
  },
  started() {
    this.db = require('../repository');
  }
};

module.exports = Service;
