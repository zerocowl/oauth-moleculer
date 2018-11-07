export default function(sequelize, DataTypes) {
  const OAuthScope = sequelize.define(
    'OAuthScope',
    {
      scope: DataTypes.STRING(80),
      is_default: DataTypes.BOOLEAN
    },
    {
      tableName: 'oauth_scopes',
      underscored: true,
      paranoid: process.env.NODE_ENV === 'production'
    }
  );

  OAuthScope.associate = models => {};

  return OAuthScope;
}
