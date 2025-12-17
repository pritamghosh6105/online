const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// User schema inline for seeding
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  studentId: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ studentId: '27900123027' });
    
    if (existingAdmin) {
      console.log('Admin already exists with ID 27900123027');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('06102005', salt);

    // Create admin
    await User.create({
      name: 'Admin',
      email: 'admin@examin.com',
      password: hashedPassword,
      role: 'admin',
      studentId: '27900123027',
      isActive: true
    });

    console.log('✅ Admin created successfully');
    console.log('   ID: 27900123027');
    console.log('   Password: 06102005');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
