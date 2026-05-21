import sequelize from '../../src/db/sequelize';
import User from '../../src/models/user';
import Image from '../../src/models/image';
import Preset from '../../src/models/preset';

describe('Database Models', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('should create a User and retrieve it', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password_hash: 'hashed_pw',
    });
    const found = await User.findOne({ where: { email: 'test@example.com' } });
    expect(found).not.toBeNull();
    expect(found!.email).toBe('test@example.com');
  });

  it('should create an Image linked to a User', async () => {
    const user = await User.create({
      email: 'imguser@example.com',
      password_hash: 'pw',
    });
    const image = await Image.create({
      user_id: user.id,
      url: 'http://example.com/img.jpg',
      original_filename: 'img.jpg',
      width: 800,
      height: 600,
      exif_metadata: { camera: 'Canon' },
    });
    const found = await Image.findOne({ where: { id: image.id }, include: [{ model: User, as: 'user' }] });
    expect(found).not.toBeNull();
    expect(found!.user_id).toBe(user.id);
    expect(found!.exif_metadata).toEqual({ camera: 'Canon' });
  });

  it('should create a Preset (system and user)', async () => {
    const user = await User.create({
      email: 'presetuser@example.com',
      password_hash: 'pw',
    });
    const userPreset = await Preset.create({
      user_id: user.id,
      name: 'Crop 4:3',
      operations: [{ op: 'crop', aspect: '4:3' }],
      is_system: false,
    });
    const systemPreset = await Preset.create({
      name: 'Resize 1080p',
      operations: [{ op: 'resize', width: 1920, height: 1080 }],
      is_system: true,
    });
    const foundUserPreset = await Preset.findOne({ where: { id: userPreset.id }, include: [{ model: User, as: 'user' }] });
    const foundSystemPreset = await Preset.findOne({ where: { id: systemPreset.id } });
    expect(foundUserPreset).not.toBeNull();
    expect(foundUserPreset!.user_id).toBe(user.id);
    expect(foundUserPreset!.is_system).toBe(false);
    expect(foundSystemPreset!.is_system).toBe(true);
    expect(foundSystemPreset!.user_id).toBeNull();
  });

  it('should enforce relationships and allow access via ORM', async () => {
    const user = await User.create({
      email: 'reluser@example.com',
      password_hash: 'pw',
    });
    const image = await Image.create({
      user_id: user.id,
      url: 'http://example.com/relimg.jpg',
    });
    const preset = await Preset.create({
      user_id: user.id,
      name: 'Test Preset',
      operations: [{ op: 'convert', format: 'png' }],
    });
    const userImages = await user.getImages();
    const userPresets = await user.getPresets();
    expect(userImages.length).toBeGreaterThan(0);
    expect(userPresets.length).toBeGreaterThan(0);
  });
});
