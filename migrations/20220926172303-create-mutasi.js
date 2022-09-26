'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('mutasis', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      idTransaksi: {
        type: Sequelize.INTEGER
      },
      tanggal: {
        type: Sequelize.STRING
      },
      transaksi: {
        type: Sequelize.STRING
      },
      debet: {
        type: Sequelize.STRING
      },
      kredit: {
        type: Sequelize.STRING
      },
      saldo: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('mutasis');
  }
};