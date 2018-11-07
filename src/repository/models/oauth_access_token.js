export default function(sequelize, DataTypes) {
  const OAuthAccessToken = sequelize.define(
    'OAuthAccessToken',
    {
      access_token: DataTypes.STRING(256),
      expires: DataTypes.DATE,
      scope: DataTypes.STRING
    },
    {
      tableName: 'oauth_access_tokens',
      underscored: true,
      paranoid: process.env.NODE_ENV === 'production'
    }
  );

  OAuthAccessToken.associate = models => {
    models.OAuthAccessToken.belongsTo(models.OAuthClient, {
      as: 'client',
      foreignKey: 'client_id'
    });

    models.OAuthAccessToken.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'user_id'
    });
  };

  return OAuthAccessToken;
}
