module.exports = (sequelize, DataTypes) => {
  const Properties = sequelize.define('Properties', {
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    amount: DataTypes.DECIMAL,
    city: DataTypes.STRING,
    postalCode: DataTypes.STRING,
    user_id: DataTypes.DECIMAL,
    type: DataTypes.TEXT,
    images: DataTypes.TEXT,
    availability: DataTypes.DECIMAL,
    contactNo: DataTypes.DECIMAL,
    contatctEmail: DataTypes.TEXT
  });

  Properties.associate = (models) => {
    // Make sure the association matches the foreign key in the Land model
    Properties.hasOne(models.Land, {
      foreignKey: 'property_id', // The foreign key in Land model that references Properties
      as: 'landDetails', // This alias is important for eager loading
    });
  };

  return Properties;
};
