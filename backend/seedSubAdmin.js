const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const seedSubAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if test sub-admin exists
    let geoAdmin = await User.findOne({ email: 'geoadmin@examin.com' });
    if (!geoAdmin) {
      geoAdmin = await User.create({
        name: 'Geography School Admin',
        email: 'geoadmin@examin.com',
        password: 'password123',
        role: 'admin',
        institution: 'Geography Academy',
        studentId: '11111111111',
        isApproved: true,
        isActive: true
      });
      console.log('✅ Geo Sub-Admin created successfully');
    } else {
      geoAdmin.isApproved = true;
      geoAdmin.institution = 'Geography Academy';
      geoAdmin.role = 'admin';
      await geoAdmin.save();
      console.log('✅ Geo Sub-Admin updated successfully');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error seeding sub-admin:', err);
    process.exit(1);
  }
};

seedSubAdmin();
