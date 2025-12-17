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

const deleteOldAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully\n');

    // Delete the old admin
    const result = await User.deleteOne({ studentId: '27900123025' });
    
    if (result.deletedCount > 0) {
      console.log('✅ Old admin with ID 27900123025 deleted successfully');
    } else {
      console.log('❌ No admin found with ID 27900123025');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

deleteOldAdmin();
