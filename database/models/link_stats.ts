import { Table, Model, Column, DataType, PrimaryKey, Unique} from 'sequelize-typescript';
import Link from './link';

@Table({
    timestamps: false,
    tableName: 'link_stats',
})

class LinkStats extends Model {
    @PrimaryKey
    @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true })
    ID!: number;

    @Unique('link-date-unique')
    @Column({ type: DataType.STRING, allowNull: true})
    link_id!: string;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    totalClicks!: number;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    humanClicks!: number;

    @Unique('link-date-unique')
    @Column({ type: DataType.STRING, allowNull: false, defaultValue: 0 })
    date!: string;

    @Column({ type: DataType.TEXT, allowNull: true })
    data!: string;

    @Column({ type: DataType.STRING, allowNull: false })
    last_updated!: string;
}

export default LinkStats;
