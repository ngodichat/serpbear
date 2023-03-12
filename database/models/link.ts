import { Table, Model, Column, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'link',
})

class Link extends Model {
   @PrimaryKey
   @Column({ type: DataType.STRING, allowNull: false, primaryKey: true, unique: true })
   ID!: string;

   @Column({ type: DataType.TEXT, allowNull: true })
   tags!: string;
   
   @Column({ type: DataType.TEXT, allowNull: false })
   data!: string;

   @Column({ type: DataType.INTEGER, allowNull: false })
   domain_id!: number;

   @Column({ type: DataType.STRING, allowNull: false })
   last_updated!: string;
}

export default Link;