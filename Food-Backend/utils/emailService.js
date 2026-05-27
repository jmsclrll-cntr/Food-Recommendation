const nodemailer = require('nodemailer');
require('dotenv').config();

const sendOTPEmail = async (email, otp) => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        console.log(`\n======================================================`);
        console.log(`[OTP FALLBACK] No email credentials in .env.`);
        console.log(`[OTP Verification] Code for ${email} is: ${otp}`);
        console.log(`======================================================\n`);
        return { success: true, method: 'console' };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        const mailOptions = {
            from: `"NutriFind" <${user}>`,
            to: email,
            subject: 'NutriFind - Email Verification OTP',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="font-family: serif; color: #1c3a1c; font-style: italic; text-align: center; margin-bottom: 5px;">NutriFind</h2>
                    <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; text-align: center; color: #6a9966; margin-top: 0; font-weight: bold; margin-bottom: 25px;">Premium Nutrition</p>
                    <p style="font-size: 14px; color: #4a5568;">Hi there,</p>
                    <p style="font-size: 14px; color: #4a5568;">Thank you for registering with NutriFind. To verify your email address, please use the 6-digit verification code below:</p>
                    <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d5a27;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #718096; text-align: center;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[OTP Verification] Sent email containing code to ${email}`);
        return { success: true, method: 'email' };
    } catch (error) {
        console.error(`[OTP Verification Error] Failed to send email via SMTP:`, error.message);
        console.log(`\n======================================================`);
        console.log(`[OTP FALLBACK] Printing code to terminal due to send error:`);
        console.log(`[OTP Verification] Code for ${email} is: ${otp}`);
        console.log(`======================================================\n`);
        return { success: true, method: 'console_fallback', error: error.message };
    }
};

const sendResetPasswordOTPEmail = async (email, otp) => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        console.log(`\n======================================================`);
        console.log(`[OTP FALLBACK] No email credentials in .env.`);
        console.log(`[Forgot Password OTP] Code for ${email} is: ${otp}`);
        console.log(`======================================================\n`);
        return { success: true, method: 'console' };
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });

        const mailOptions = {
            from: `"NutriFind" <${user}>`,
            to: email,
            subject: 'NutriFind - Password Reset OTP',
            html: `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                    <h2 style="font-family: serif; color: #1c3a1c; font-style: italic; text-align: center; margin-bottom: 5px;">NutriFind</h2>
                    <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; text-align: center; color: #6a9966; margin-top: 0; font-weight: bold; margin-bottom: 25px;">Premium Nutrition</p>
                    <p style="font-size: 14px; color: #4a5568;">Hi there,</p>
                    <p style="font-size: 14px; color: #4a5568;">We received a request to reset the password for your NutriFind account. Please use the 6-digit verification code below to complete the reset process:</p>
                    <div style="background-color: #f7fafc; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px dashed #cbd5e0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2d5a27;">${otp}</span>
                    </div>
                    <p style="font-size: 12px; color: #718096; text-align: center;">This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Forgot Password OTP] Sent email containing code to ${email}`);
        return { success: true, method: 'email' };
    } catch (error) {
        console.error(`[Forgot Password OTP Error] Failed to send email via SMTP:`, error.message);
        console.log(`\n======================================================`);
        console.log(`[OTP FALLBACK] Printing code to terminal due to send error:`);
        console.log(`[Forgot Password OTP] Code for ${email} is: ${otp}`);
        console.log(`======================================================\n`);
        return { success: true, method: 'console_fallback', error: error.message };
    }
};

module.exports = { sendOTPEmail, sendResetPasswordOTPEmail };
