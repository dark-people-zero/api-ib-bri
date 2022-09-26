'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class mutasi extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  mutasi.init({
    idTransaksi: DataTypes.INTEGER,
    tanggal: DataTypes.STRING,
    transaksi: DataTypes.STRING,
    debet: DataTypes.STRING,
    kredit: DataTypes.STRING,
    saldo: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'mutasi',
  });
  return mutasi;
};