import db from '../repository';
import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';
import { Errors } from 'moleculer';
const { MoleculerError } = Errors;

class Repository {
  /**
   *
   * @param {String} model
   */
  constructor(model) {
    const self = this;
    self.name = '';

    self.settings = {
      model: db[model],
      repository: db,
      Op: db.Sequelize.Op
    };

    self.methods = {
      beginTransaction: self.beginTransaction,
      create: self.create,
      findById: self.findById,
      findOne: self.findOne,
      list: self.list,
      remove: self.remove,
      update: self.update
    };
  }

  /**
   *
   */
  beginTransaction() {
    const { repository: db } = this.settings;
    return db.sequelize.transaction();
  }

  /**
   *
   * @param {Object} data
   */
  async create(data, options = {}) {
    const { model } = this.settings;
    try {
      return model.create(data, options);
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new MoleculerError(
          `${err.errors[0].path} with value ${err.errors[0].value}already exists`,
          400,
          'DUPLICATE_DATA',
          err.errors
        );
      } else if (err instanceof ValidationError) {
        throw new MoleculerError(
          'The request contains invalid fields',
          400,
          'INVALID_DATA',
          err.errors
        );
      } else if (err instanceof ForeignKeyConstraintError) {
        throw new MoleculerError(
          'Relationship ID not found',
          400,
          'REFERENCE_NOT_FOUND',
          err.errors
        );
      } else {
        throw err;
      }
    }
  }

  /**
   *
   * @param {Number} id
   */
  async findById(id, options = {}) {
    const { model } = this.settings;
    const result = await model.findById(id, options);
    if (!result) {
      throw new MoleculerError(
        `No results found for id = ${id}`,
        404,
        'NO_RESULT',
        null
      );
    }
    return result;
  }

  /**
   *
   * @param {Object} filters
   */
  async findOne(filters = {}, options = {}) {
    const { model } = this.settings;
    const criteria = Object.keys(filters)
      .filter(key => Object.keys(model.attributes).includes(key))
      .reduce((fn, key) => {
        fn[key] = filters[key];
        return fn;
      }, {});
    const result = await model.findOne({ where: criteria, ...options });
    if (!result) {
      throw new MoleculerError('No results found', 404, 'NO_RESULT', null);
    }
    return result;
  }

  /**
   *
   * @param {Number} limit
   * @param {Number} offset
   * @param {Object} filter
   */
  async list(limit = 15, offset = 0, filters = {}, options = {}) {
    const { model } = this.settings;
    const criteria = Object.keys(filters)
      .filter(key => Object.keys(model.attributes).includes(key))
      .reduce((fn, key) => {
        fn[key] = filters[key];
        return fn;
      }, {});
    const { count, rows } = await model.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      where: criteria,
      ...options
    });
    return { count, rows };
  }

  /**
   *
   * @param {Number} id
   */
  async remove(id) {
    const result = await this.findById(id);
    await result.destroy();
  }

  /**
   *
   * @param {Number || Object} id
   * @param {Object} params
   */
  async update(criteria, params) {
    const fn = typeof criteria === 'object' ? this.findOne(criteria) : this.findById(criteria);
    let result = await fn;
    return result.update(params);
  }
}

export default Repository;
