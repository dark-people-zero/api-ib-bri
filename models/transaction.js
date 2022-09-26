'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.mutasi, {
        as: 'mutasi',
        foreignKey: 'idTransaksi',
        sourceKey: 'id',
      });
    }
  }
  transaction.init({
    username: DataTypes.STRING,
    nomorRekening: DataTypes.STRING,
    status: DataTypes.BOOLEAN,
    saldo: DataTypes.TEXT,
    error: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'transaction',
  });
  return transaction;
};