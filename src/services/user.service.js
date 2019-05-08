import Repository from '../mixins/repository.mixin';

const Service = {
  name: 'user',

  mixins: [new Repository('User')],

  actions: {
    create(ctx) {
      return this.create(ctx.params);
    },

    findById(ctx) {
      return this.findById(ctx.params.id);
    },

    list() {
      return this.list();
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
