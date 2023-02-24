import { Table, Model, Column, DataType, PrimaryKey, Unique } from 'sequelize-typescript';

@Table({
  timestamps: false,
  tableName: 'country',
})

class Country extends Model {
   @PrimaryKey
   @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
   ID!: number;

   @Unique
   @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: true, unique: true })
   location_code!: number;

   @Unique
   @Column({ type: DataType.STRING, allowNull: false, defaultValue: true, unique: true })
   location_name!: string;

   @Column({ type: DataType.INTEGER, allowNull: true })
   location_code_parent!: number;

   @Column({ type: DataType.STRING, allowNull: false })
   country_iso_code!: string;
}

export default Country;
