const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const updateSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await User.updateOne(
      { email: 'admin@examin.com' },
      { role: 'superadmin', isApproved: true }
    );
    console.log('✅ Main admin (admin@examin.com) updated to superadmin:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error updating superadmin:', err);
    process.exit(1);
  }
};

updateSuperAdmin();
