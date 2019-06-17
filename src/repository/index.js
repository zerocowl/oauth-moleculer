'use strict';
import fs from 'fs';
import path from 'path';
import Sequelize from 'sequelize';
import _config from './config/config';

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = _config[env];
const db = {};

let sequelize = null;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs.readdirSync(path.join(__dirname, 'models'))
  .filter(file => {
    return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
  })
  .forEach(file => {
    var model = sequelize['import'](path.join(__dirname, 'models', file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize.sync({ force: true });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
