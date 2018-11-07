export default function(sequelize, DataTypes) {
  const OAuthClient = sequelize.define(
    'OAuthClient',
    {
      client_id: DataTypes.STRING(80),
      client_secret: DataTypes.STRING(80),
      grant_types: DataTypes.STRING(80),
      name: DataTypes.STRING(255),
      redirect_uri: DataTypes.STRING(2000),
      scope: DataTypes.STRING
    },
    {
      tableName: 'oauth_clients',
      underscored: true,
      paranoid: process.env.NODE_ENV === 'production'
    }
  );

  return OAuthClient;
}
