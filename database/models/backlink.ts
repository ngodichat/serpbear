import { Table, Model, Column, DataType, PrimaryKey } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'backlink',
})

class BackLink extends Model {
   @PrimaryKey
   @Column({ type: DataType.STRING, allowNull: false, primaryKey: true, unique: true })
   URL!: string;

   @Column({ type: DataType.STRING, allowNull: true })
   anchor_text!: string;

   @Column({ type: DataType.INTEGER, allowNull: true })
   source_trust_flow!: number;

   @Column({ type: DataType.INTEGER, allowNull: true })
   source_citation_flow!: number;

   @Column({ type: DataType.INTEGER, allowNull: true })
   domain_trust_flow!: number;

   @Column({ type: DataType.INTEGER, allowNull: true })
   domain_citation_flow!: number;
   
   @Column({ type: DataType.STRING, allowNull: true })
   link_first_index_date!: string;

   @Column({ type: DataType.STRING, allowNull: false })
   domain!: string;
   
   @Column({ type: DataType.STRING, allowNull: false })
   last_updated!: string;
}

export default BackLink;
