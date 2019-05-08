import { compareSync, hashSync, genSaltSync } from 'bcryptjs';

export default function(sequelize, DataTypes) {
  const User = sequelize.define(
    'User',
    {
      active: {
        defaultValue: false,
        type: DataTypes.BOOLEAN
      },
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: {
            msg: 'Invalid email'
          }
        }
      },
      msisdn: {
        allowNull: true,
        set(val) {
          this.setDataValue('msisdn', val.replace(/[^\w\s]/gi, ''));
        },
        type: DataTypes.STRING,
        unique: true
      },
      password: DataTypes.STRING,
      password_reset_token: DataTypes.STRING,
      password_reset_token_expires_at: DataTypes.DATE,
      scope: {
        defaultValue: 'profile',
        get() {
          return this.getDataValue('scope').split(', ');
        },
        type: DataTypes.STRING
      }
    },
    {
      tableName: 'users', // oauth_users
      underscored: true,
      paranoid: process.env.NODE_ENV === 'production'
    }
  );

  User.beforeSave((user, options) => {
    if (user.changed('password')) {
      const salt = genSaltSync(10);
      user.password = hashSync(user.password, salt);
    }
  });

  User.prototype.verifyPassword = function(password) {
    return compareSync(password, this.password);
  };

  return User;
}
