const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const testEmail = async () => {
  try {
    console.log('Testing email configuration...\n');
    console.log('SMTP Settings:');
    console.log(`  Host: ${process.env.SMTP_HOST}`);
    console.log(`  Port: ${process.env.SMTP_PORT}`);
    console.log(`  User: ${process.env.SMTP_USER}`);
    console.log(`  Pass: ${process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET'}\n`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Examin System" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'Test Email - Examin System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Email Configuration Test</h2>
          <p>This is a test email from the Examin system.</p>
          <p>If you receive this email, your SMTP configuration is working correctly!</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
            <p style="margin: 5px 0;"><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
            <p style="margin: 5px 0;"><strong>From Email:</strong> ${process.env.SMTP_USER}</p>
          </div>
          <p style="color: #059669; font-weight: bold;">✅ Email system is working!</p>
          <p>Best regards,<br>Examin Team</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   To: ${process.env.SMTP_USER}`);
    console.log('\n✅ Email configuration is working correctly!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n⚠️  Authentication failed. Please check:');
      console.error('   1. SMTP_USER email is correct');
      console.error('   2. SMTP_PASS is a valid App Password (not regular password)');
      console.error('   3. 2-Factor Authentication is enabled on the Gmail account');
      console.error('   4. App Password has no spaces');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n⚠️  Connection failed. Please check:');
      console.error('   1. Internet connection');
      console.error('   2. SMTP_HOST and SMTP_PORT are correct');
      console.error('   3. Firewall is not blocking port 587');
    }
    
    process.exit(1);
  }
};

testEmail();
