import { Resend } from 'resend';
import VerificationEmail from '../emails/VerificationEmail.js';

export async function sendVerificationEmail(
  email,
  username,
  verifyCode
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    console.log(verifyCode, email)
    await resend.emails.send({
      from: "GlobalConnect <onboarding@resend.dev>",
      to: email,
      subject: 'Message Verification Code',
      html: VerificationEmail({ username, otp: verifyCode }),
    });
    return { success: true, message: 'Verification email sent successfully.' };
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    return { success: false, message: 'Failed to send verification email.' };
  }
}
