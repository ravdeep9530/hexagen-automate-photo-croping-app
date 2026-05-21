import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/sequelize';
import User from './user';

class Image extends Model {
  public id!: number;
  public user_id!: number;
  public url!: string;
  public original_filename?: string;
  public uploaded_at!: Date;
  public width?: number;
  public height?: number;
  public exif_metadata?: object;
  public processed?: boolean;
}

Image.init(
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
    url: {
      type: DataTypes.STRING(512),
      allowNull: false,
    },
    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    exif_metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    processed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'images',
    timestamps: false,
  }
);

Image.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Image, { foreignKey: 'user_id', as: 'images' });

export default Image;
