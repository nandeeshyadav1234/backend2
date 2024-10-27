// models/Land.js
module.exports = (sequelize, DataTypes) => {
    const Land = sequelize.define('Land', {
      electricity: DataTypes.BOOLEAN,
      tapwater: DataTypes.BOOLEAN,
      size: DataTypes.FLOAT,
      nearestSchool: DataTypes.STRING,
      nearestRailway: DataTypes.STRING,
      nearestBusStop: DataTypes.STRING,
      property_id: DataTypes.INTEGER,
    });
  
    Land.associate = (models) => {
      Land.belongsTo(models.Properties, {
        foreignKey: 'property_id',
        as: 'property',
      });
    };
  
    return Land;
  };
  