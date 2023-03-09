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

    await queryInterface.addColumn('domain', 'target_trust_flow', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('domain', 'target_citation_flow', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('domain', 'target_topical_trust_flow_topic', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('domain', 'target_topical_trust_flow_value', {
      type: Sequelize.INTEGER,
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

    await queryInterface.removeColumn('domain', 'target_trust_flow');
    await queryInterface.removeColumn('domain', 'target_citation_flow');
    await queryInterface.removeColumn('domain', 'target_topical_trust_flow_topic');
    await queryInterface.removeColumn('domain', 'target_topical_trust_flow_value');
  }
};
