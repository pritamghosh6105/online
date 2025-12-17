const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// User schema inline
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  studentId: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const updateMainAdminId = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully');

    // Find the old admin
    const oldAdmin = await User.findOne({ studentId: '27900123025' });
    
    if (oldAdmin) {
      console.log('Found admin with old ID: 27900123025');
      
      // Update the student ID
      oldAdmin.studentId = '27900123027';
      await oldAdmin.save();
      
      console.log('✅ Admin ID updated successfully');
      console.log('   New ID: 27900123027');
      console.log('   Email:', oldAdmin.email);
    } else {
      console.log('❌ No admin found with ID 27900123025');
      console.log('Creating new admin with ID 27900123027...');
      
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('06102005', salt);

      await User.create({
        name: 'Admin',
        email: 'admin@examin.com',
        password: hashedPassword,
        role: 'admin',
        studentId: '27900123027',
        isActive: true
      });
      
      console.log('✅ New admin created with ID 27900123027');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin ID:', error);
    process.exit(1);
  }
};

updateMainAdminId();
