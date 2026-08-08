const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '7d',
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
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"Examin Platform" <${process.env.SMTP_USER}>`,
      replyTo: process.env.SMTP_USER,
      to: email,
      subject: `Your Examin Student Credentials - ID: ${studentId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 25px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #2563eb; margin-top: 0;">Welcome to Examin!</h2>
          <p style="font-size: 15px; color: #334155;">Dear <strong>${name}</strong>,</p>
          <p style="font-size: 15px; color: #334155;">Your student registration is complete. Here are your official account credentials:</p>
          <div style="background-color: #f1f5f9; padding: 18px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 6px 0; font-size: 16px;"><strong>Student ID:</strong> <span style="color: #2563eb; font-weight: 800;">${studentId}</span></p>
            <p style="margin: 6px 0; font-size: 15px;"><strong>Password:</strong> ${password}</p>
          </div>
          <p style="font-size: 14px; color: #64748b;">Please save your 11-digit Student ID (<code>${studentId}</code>) securely. You will use this ID to sign into your student portal.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you cannot find this email in your Inbox, please check your <strong>Spam / Junk</strong> folder or <strong>Promotions</strong> tab.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Credentials email sent successfully to ${email} (MessageID: ${info.messageId})`);
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

// @desc    Get all approved institutions
// @route   GET /api/auth/institutions/approved
// @access  Public
const getApprovedInstitutions = async (req, res) => {
  try {
    // Find approved admins with an institution name
    const approvedUsers = await User.find({
      role: { $in: ['admin', 'superadmin'] },
      isApproved: true,
      institution: { $ne: '' }
    }).select('institution').lean();

    const rawInstitutions = approvedUsers.map(u => u.institution).filter(Boolean);
    const institutions = [...new Set(rawInstitutions)];

    res.json({
      success: true,
      institutions
    });
  } catch (error) {
    console.error('Get approved institutions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching institutions'
    });
  }
};

// @desc    Get pending sub-admins
// @route   GET /api/auth/pending-admins
// @access  Private (Admin / SuperAdmin)
const getPendingAdmins = async (req, res) => {
  try {
    const pendingAdmins = await User.find({
      role: 'admin',
      isApproved: false
    }).select('name email institution studentId createdAt').lean();

    res.json({
      success: true,
      pendingAdmins: pendingAdmins.map(admin => ({
        id: admin._id,
        name: admin.name,
        email: admin.email,
        institution: admin.institution,
        studentId: admin.studentId,
        createdAt: admin.createdAt
      }))
    });
  } catch (error) {
    console.error('Get pending admins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pending admins'
    });
  }
};

// @desc    Approve sub-admin
// @route   PUT /api/auth/approve-admin/:id
// @access  Private (Admin / SuperAdmin)
const approveAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    admin.isApproved = true;
    await admin.save();

    console.log(`✅ Admin approved: ${admin.name} (${admin.institution})`);

    res.json({
      success: true,
      message: `Admin for ${admin.institution || 'institution'} approved successfully`,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        institution: admin.institution,
        isApproved: admin.isApproved
      }
    });
  } catch (error) {
    console.error('Approve admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while approving admin'
    });
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

    const { name, email, password, role, institution } = req.body;

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

    // Sub-admins require approval, students and superadmin auto-approved
    const isApproved = role === 'admin' ? false : true;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      institution: institution ? institution.trim() : '',
      isApproved,
      studentId
    });

    // Send email with credentials for students in background (non-blocking)
    if (studentId) {
      sendCredentialsEmail(email, name, studentId, req.body.password)
        .then(sent => {
          if (sent) console.log('✅ Credentials email sent successfully to:', email);
          else console.warn('⚠️  Failed to send credentials email to:', email, '(Configure SMTP in .env)');
        })
        .catch(emailErr => {
          console.error('❌ Email sending error:', emailErr.message);
        });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: role === 'admin' 
        ? 'Admin account registered successfully. Pending Super Admin approval.' 
        : 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        isApproved: user.isApproved,
        studentId: user.studentId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please login or use another email.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
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

    // Check if admin is approved
    if (user.role === 'admin' && !user.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your institution/admin account is pending Super Admin approval. Please contact the administrator.'
      });
    }

    // Check for ongoing active exam session (Single Active Login during active exam)
    if (user.role === 'student' && user.activeExamSession && user.activeExamSession.isActive) {
      const sessionStartTime = new Date(user.activeExamSession.startTime || Date.now());
      const hoursElapsed = (Date.now() - sessionStartTime.getTime()) / (1000 * 60 * 60);

      // If active exam session was started within the last 6 hours, block new login
      if (hoursElapsed < 6) {
        return res.status(403).json({
          success: false,
          message: '🚫 Login Blocked: You have an ongoing active examination session running in another browser or device. Simultaneous logins during active exams are strictly prohibited.'
        });
      } else {
        // Auto-expire stale exam session if older than 6 hours
        user.activeExamSession.isActive = false;
        await user.save();
      }
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
        institution: user.institution,
        isApproved: user.isApproved,
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
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or account inactive'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
        isApproved: user.isApproved,
        studentId: user.studentId,
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
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } });
    
    const formattedAdmins = await Promise.all(admins.map(async (admin) => {
      // Auto-assign studentId for admins missing an ID
      if (!admin.studentId) {
        if (admin.email === 'admin@examin.com') {
          admin.studentId = '11111111111';
        } else {
          admin.studentId = Date.now().toString().slice(-8) + Math.floor(100 + Math.random() * 900).toString();
        }
        await admin.save().catch(() => {});
      }

      return {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        institution: admin.institution || '',
        studentId: admin.studentId,
        createdAt: admin.createdAt
      };
    }));
    
    res.json({
      success: true,
      admins: formattedAdmins
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

    // Find admin by logged-in user ID, old student ID, or email
    let admin = null;
    if (req.user?._id) {
      admin = await User.findById(req.user._id).select('+password');
    }
    if (!admin && oldAdminId) {
      admin = await User.findOne({ studentId: oldAdminId }).select('+password');
    }
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found'
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

    // If newStudentId provided and different, update it
    if (newStudentId && newStudentId.length === 11 && newStudentId !== admin.studentId) {
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
      admin.studentId = newStudentId;
    }

    // Update password if provided
    if (newPassword) {
      admin.password = newPassword;
    }

    await admin.save();

    console.log(`✅ Admin credentials updated for ${admin.name} (${admin.email})`);

    res.json({
      success: true,
      message: 'Password & credentials updated successfully',
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

    // Fire background email sending (non-blocking)
    sendAdminCredentialsEmail(email, name, adminId, password).catch(err => {
      console.error('❌ Background email sending error:', err.message);
    });

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

// @desc    Change user password (for Students and Admins)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide both current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

// @desc    Clear active exam session on logout or exam completion
// @route   POST /api/auth/clear-exam-session
// @access  Private
const clearActiveExamSession = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      'activeExamSession.isActive': false
    });
    res.json({ success: true, message: 'Active exam session cleared' });
  } catch (error) {
    console.error('Clear active exam session error:', error);
    res.status(500).json({ success: false, message: 'Server error while clearing exam session' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAdmins,
  getApprovedInstitutions,
  getPendingAdmins,
  approveAdmin,
  changeCredentials,
  changePassword,
  addAdmin,
  deleteAdmin,
  clearActiveExamSession
};