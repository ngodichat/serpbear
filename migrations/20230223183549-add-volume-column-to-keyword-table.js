'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addColumn('keyword', 'volume', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('keyword', 'low_top_of_page_bid', {
      type: Sequelize.DECIMAL(10,2),
      allowNull: true
    });

    await queryInterface.addColumn('keyword', 'high_top_of_page_bid', {
      type: Sequelize.DECIMAL(10,2),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

    await queryInterface.removeColumn('keyword', 'search_volume');
    await queryInterface.removeColumn('keyword', 'low_top_of_page_bid');
    await queryInterface.removeColumn('keyword', 'high_top_of_page_bid');
  }
};
