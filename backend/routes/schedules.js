const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Schedule = require('../models/Schedule');

// @route   POST /api/schedules
// @desc    Submit a new scheduled test request (Public)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, institution, date, testType } = req.body;

    if (!name || !email || !institution || !date) {
      return res.status(400).json({ message: 'Name, email, institution, and date are required' });
    }

    const schedule = new Schedule({
      name,
      email,
      institution,
      date,
      testType: testType || 'university'
    });

    await schedule.save();

    res.status(201).json({
      message: 'Schedule request submitted successfully',
      schedule
    });
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Server error creating schedule request' });
  }
});

// @route   GET /api/schedules
// @desc    Get all scheduled test requests
// @access  Public / Admin
router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ createdAt: -1 });
    res.json({
      count: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error fetching schedule requests' });
  }
});

// Helper function to send email with Admin credentials
const sendAdminCredentialsEmail = async (email, name, adminId, password, institution) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: `"Examin Portal Admin" <${process.env.SMTP_USER || 'noreply@examin.com'}>`,
      to: email,
      subject: `🎉 Approved! Admin Login Credentials for ${institution}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #2563eb; font-size: 24px; margin-bottom: 5px;">Examin Assessment Platform</h1>
            <p style="color: #64748b; font-size: 14px; margin: 0;">Institutional Administrator Access Granted</p>
          </div>

          <p style="color: #1e293b; font-size: 16px;">Dear <strong>${name}</strong>,</p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            Your scheduled test request / institutional demo for <strong>${institution}</strong> has been <strong>Approved & Confirmed</strong>! 
            We have created your Administrator account.
          </p>

          <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; padding: 18px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">Your Admin Login Credentials</h3>
            <p style="margin: 6px 0; color: #1e293b; font-size: 14px;"><strong>Institution:</strong> ${institution}</p>
            <p style="margin: 6px 0; color: #1e293b; font-size: 14px;"><strong>Admin / Student ID:</strong> <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; color: #2563eb; font-weight: bold;">${adminId}</code></p>
            <p style="margin: 6px 0; color: #1e293b; font-size: 14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 6px 0; color: #1e293b; font-size: 14px;"><strong>Password:</strong> <code style="background: #ffffff; padding: 2px 6px; border-radius: 4px; color: #dc2626; font-weight: bold;">${password}</code></p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="http://localhost:3000/admin-login" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">Log In to Admin Portal</a>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
            You can now log in to create custom exams, manage subjects, and monitor student assessments for <strong>${institution}</strong>.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">Examin Online Examination System &copy; 2026</p>
        </div>
      `
    };

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Admin Credentials Email successfully sent to ${email}`);
      return true;
    } else {
      console.log(`[SMTP Not Configured] Logged Admin Credentials for ${email}: ID=${adminId}, Pass=${password}`);
      return false;
    }
  } catch (err) {
    console.error('Failed to send admin credentials email:', err);
    return false;
  }
};

// @route   PUT /api/schedules/:id
// @desc    Update schedule request status and auto-create Admin if confirmed/completed
// @access  Admin
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule request not found' });
    }

    if (status) schedule.status = status;
    await schedule.save();

    let createdAdmin = null;

    // If status is confirmed or completed, auto-create or approve Admin account
    if (status === 'confirmed' || status === 'completed') {
      const User = require('../models/User');
      let existingUser = await User.findOne({ email: schedule.email });

      if (!existingUser) {
        const generatedPassword = 'Admin@' + Math.floor(100000 + Math.random() * 900000);
        const adminId = Date.now().toString().slice(-8) + Math.floor(100 + Math.random() * 900).toString();

        existingUser = await User.create({
          name: schedule.name,
          email: schedule.email,
          password: generatedPassword,
          role: 'admin',
          institution: schedule.institution,
          studentId: adminId,
          isApproved: true,
          isActive: true
        });

        const emailSent = await sendAdminCredentialsEmail(
          schedule.email,
          schedule.name,
          adminId,
          generatedPassword,
          schedule.institution
        );

        createdAdmin = {
          name: schedule.name,
          email: schedule.email,
          adminId: adminId,
          password: generatedPassword,
          institution: schedule.institution,
          emailSent,
          isNew: true
        };
      } else {
        // If user already exists, update role to admin and approve
        existingUser.role = 'admin';
        existingUser.isApproved = true;
        existingUser.institution = schedule.institution || existingUser.institution;
        await existingUser.save();

        createdAdmin = {
          name: existingUser.name,
          email: existingUser.email,
          adminId: existingUser.studentId || 'Existing ID',
          password: '(Existing Account Password)',
          institution: existingUser.institution,
          emailSent: false,
          isNew: false
        };
      }
    }

    res.json({ 
      message: `Schedule status updated to "${status}" successfully`, 
      schedule,
      createdAdmin
    });
  } catch (error) {
    console.error('Error updating schedule status:', error);
    res.status(500).json({ message: 'Server error updating schedule status' });
  }
});

// @route   DELETE /api/schedules/:id
// @desc    Delete a schedule request
// @access  Admin
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule request not found' });
    }

    await Schedule.findByIdAndDelete(req.params.id);
    res.json({ message: 'Schedule request deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule request:', error);
    res.status(500).json({ message: 'Server error deleting schedule request' });
  }
});

module.exports = router;
