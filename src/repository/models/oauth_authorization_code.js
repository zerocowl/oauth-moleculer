export default function(sequelize, DataTypes) {
  const OAuthAuthorizationCode = sequelize.define(
    'OAuthAuthorizationCode',
    {
      authorization_code: DataTypes.STRING(256),
      expires: DataTypes.DATE,
      redirect_uri: DataTypes.STRING(2000),
      scope: DataTypes.STRING
    },
    {
      tableName: 'oauth_authorization_codes',
      underscored: true,
      paranoid: process.env.NODE_ENV === 'production'
    }
  );

  OAuthAuthorizationCode.associate = models => {
    models.OAuthAuthorizationCode.belongsTo(models.OAuthClient, {
      foreignKey: 'client_id'
    });

    models.OAuthAuthorizationCode.belongsTo(models.User, {
      foreignKey: 'user_id'
    });
  };

  return OAuthAuthorizationCode;
}
