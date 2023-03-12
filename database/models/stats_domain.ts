import { Table, Model, Column, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'stats_domain',
})

class StatsDomain extends Model {
   @PrimaryKey
   @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, unique: true })
   ID!: number;

   @Column({ type: DataType.TEXT, allowNull: true })
   data!: string;

   @Column({ type: DataType.STRING, allowNull: false })
   last_updated!: string;
}

export default StatsDomain;
