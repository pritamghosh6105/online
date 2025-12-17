const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Generate unique student ID
const generateStudentId = async () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const studentId = timestamp.slice(-8) + random;
  
  // Check if ID already exists (unlikely but check anyway)
  const existing = await User.findOne({ studentId });
  if (existing) {
    return generateStudentId(); // Recursively generate new one
  }
  
  return studentId;
};

// Send email with credentials
const sendCredentialsEmail = async (email, name, studentId, password) => {
  try {
    // Create transporter (using Gmail as example)
    // You'll need to set up SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Examin System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Examin Registration Details',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to Examin!</h2>
          <p>Dear ${name},</p>
          <p>Your registration has been completed successfully. Here are your login credentials:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please keep these credentials safe. You will use your Student ID to login.</p>
          <p>Best regards,<br>Examin Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send email with admin credentials
const sendAdminCredentialsEmail = async (email, name, adminId, password) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Examin System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Examin Admin Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">Admin Account Created</h2>
          <p>Dear ${name},</p>
          <p>An admin account has been created for you in the Examin system. Here are your login credentials:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Admin ID:</strong> ${adminId}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p><strong>Important:</strong> Please keep these credentials secure. You will use your Admin ID to login.</p>
          <p>As an admin, you can:</p>
          <ul>
            <li>Create and manage exams</li>
            <li>View student submissions</li>
            <li>Monitor student performance</li>
          </ul>
          <p>Best regards,<br>Examin Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Admin email sending error:', error);
    return false;
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Generate student ID for students (admins won't get auto-generated IDs)
    let studentId = null;
    if (!role || role === 'student') {
      studentId = await generateStudentId();
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      studentId
    });

    // Send email with credentials for students
    if (studentId) {
      try {
        const emailSent = await sendCredentialsEmail(email, name, studentId, req.body.password);
        if (emailSent) {
          console.log('✅ Credentials email sent successfully to:', email);
        } else {
          console.warn('⚠️  Failed to send credentials email to:', email);
          console.warn('Please configure SMTP settings in .env file');
        }
      } catch (emailError) {
        console.error('❌ Email sending error:', emailError.message);
        console.warn('Email not sent, but registration was successful');
      }
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check for user by email OR studentId using a single query (one DB round-trip)
    const user = await User.findOne({ $or: [{ email }, { studentId: email }] }).select('+password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all admins
// @route   GET /api/auth/admins
// @access  Private (Admin only)
const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('name email studentId createdAt').lean();
    
    res.json({
      success: true,
      admins: admins.map(admin => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        studentId: admin.studentId,
        createdAt: admin.createdAt
      }))
    });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching admins'
    });
  }
};

// @desc    Change admin credentials
// @route   PUT /api/auth/change-credentials
// @access  Private (Admin only)
const changeCredentials = async (req, res) => {
  try {
    const { oldAdminId, currentPassword, newStudentId, newPassword } = req.body;

    // Find admin by old student ID (include password field)
    const admin = await User.findOne({ studentId: oldAdminId, role: 'admin' }).select('+password');
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found with this ID'
      });
    }

    // Verify current password
    const isPasswordValid = await admin.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new student ID already exists (for another user)
    const existingUser = await User.findOne({ 
      studentId: newStudentId,
      _id: { $ne: admin._id }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This Admin ID is already in use'
      });
    }

    // Update credentials
    admin.studentId = newStudentId;
    admin.password = newPassword; // Will be hashed by pre-save hook
    await admin.save();

    console.log(`✅ Admin credentials updated: ${oldAdminId} → ${newStudentId}`);

    res.json({
      success: true,
      message: 'Credentials updated successfully',
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        studentId: admin.studentId
      }
    });
  } catch (error) {
    console.error('Change credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating credentials'
    });
  }
};

// @desc    Add new admin
// @route   POST /api/auth/add-admin
// @access  Private (Admin only)
const addAdmin = async (req, res) => {
  try {
    const { name, adminId, email, password } = req.body;

    // Check if admin ID already exists
    const existingById = await User.findOne({ studentId: adminId });
    if (existingById) {
      return res.status(400).json({
        success: false,
        message: 'This Admin ID is already in use'
      });
    }

    // Check if email already exists
    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered'
      });
    }

    // Create new admin
    const admin = await User.create({
      name,
      email,
      password,
      role: 'admin',
      studentId: adminId
    });

    console.log(`✅ New admin created: ${name} (ID: ${adminId})`);

    // Send email with admin credentials
    try {
      const emailSent = await sendAdminCredentialsEmail(email, name, adminId, password);
      if (emailSent) {
        console.log('✅ Admin credentials email sent successfully to:', email);
      } else {
        console.warn('⚠️  Failed to send admin credentials email to:', email);
      }
    } catch (emailError) {
      console.error('❌ Email sending error:', emailError.message);
      console.warn('Email not sent, but admin was created successfully');
    }

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        studentId: admin.studentId
      }
    });
  } catch (error) {
    console.error('Add admin error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      if (field === 'studentId') {
        return res.status(400).json({
          success: false,
          message: 'This Admin ID is already in use. Please try a different ID.'
        });
      } else if (field === 'email') {
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please try a different email.'
        });
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating admin'
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/auth/admins/:id
// @access  Private (Admin only)
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the admin to delete
    const admin = await User.findById(id);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if it's an admin
    if (admin.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'This user is not an admin'
      });
    }

    // Prevent deleting the main admin (admin@examin.com)
    if (admin.email === 'admin@examin.com') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete the main admin account'
      });
    }

    // Delete the admin
    await User.findByIdAndDelete(id);

    // Add a small delay to ensure MongoDB unique index is updated
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`✅ Admin deleted: ${admin.name} (ID: ${admin.studentId})`);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting admin'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAdmins,
  changeCredentials,
  addAdmin,
  deleteAdmin
};