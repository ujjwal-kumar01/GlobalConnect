export default function VerificationEmail({ username, otp }) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verification Code</title>
    <style>
      body {
        font-family: Roboto, Verdana, sans-serif;
        background-color: #f4f7fb;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 500px;
        margin: 40px auto;
        background: #ffffff;
        padding: 24px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      }
      h2 {
        color: #1e3a8a;
      }
      .otp {
        font-size: 24px;
        font-weight: bold;
        color: #2563eb;
        margin: 16px 0;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Hello ${username},</h2>
      
      <p>
        Thank you for registering. Please use the following verification
        code to complete your registration:
      </p>
      
      <div class="otp">${otp}</div>
      
      <p>
        If you did not request this code, please ignore this email.
      </p>

      <div class="footer">
        — GlobalConnect Team
      </div>
    </div>
  </body>
  </html>
  `;
}