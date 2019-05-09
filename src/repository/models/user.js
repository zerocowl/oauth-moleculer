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
        allowNull: false,
        defaultValue: 'admin',
        get() {
          return this.getDataValue('scope').split(', ');
        },
        type: DataTypes.STRING
      }
    },
    {
      defaultScope: {
        attributes: {
          include: [
            [
              sequelize.literal(
                "(case when password is not null and password != '' then true else false end)"
              ),
              'has_password'
            ]
          ],
          exclude: [
            'password',
            'password_reset_token',
            'password_reset_token_expires_at',
            'created_at',
            'updated_at'
          ]
        }
      },
      scopes: {
        oauth: {}
      },
      tableName: 'users',
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
