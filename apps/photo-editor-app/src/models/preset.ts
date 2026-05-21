import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/sequelize';
import User from './user';

class Preset extends Model {
  public id!: number;
  public user_id?: number;
  public name!: string;
  public operations!: object;
  public is_system?: boolean;
  public created_at!: Date;
}

Preset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    operations: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'presets',
    timestamps: false,
  }
);

Preset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Preset, { foreignKey: 'user_id', as: 'presets' });

export default Preset;
