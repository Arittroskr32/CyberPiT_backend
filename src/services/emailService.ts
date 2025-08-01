import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

interface EmailData {
  subject: string;
  body: string;
}

interface EmailResult {
  success: boolean;
  sent: number;
  failed: number;
  errors: string[];
}

const createEmailTemplate = (subject: string, body: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 650px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.15);
                overflow: hidden;
                border: 3px solid transparent;
                background-clip: padding-box;
            }
            .header {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                color: white;
                padding: 50px 40px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                opacity: 0.1;
            }
            .logo-container {
                position: relative;
                z-index: 2;
                margin-bottom: 20px;
            }
            .logo-img {
                width: 80px;
                height: 80px;
                border-radius: 20px;
                border: 3px solid rgba(255,255,255,0.2);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                object-fit: cover;
                margin-bottom: 16px;
            }
            .logo-text {
                font-size: 36px;
                font-weight: 900;
                margin-bottom: 8px;
                background: linear-gradient(45deg, #00d4ff, #00ff88);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .tagline {
                font-size: 18px;
                opacity: 0.9;
                font-weight: 500;
                letter-spacing: 0.5px;
            }
            .content {
                padding: 50px 40px;
                background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            }
            .subject-line {
                font-size: 28px;
                font-weight: 700;
                color: #1a202c;
                margin-bottom: 30px;
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%);
                border-radius: 12px;
                border-left: 5px solid #38b2ac;
                box-shadow: 0 4px 12px rgba(56, 178, 172, 0.1);
            }
            .message {
                font-size: 18px;
                line-height: 1.8;
                margin-bottom: 40px;
                white-space: pre-line;
                color: #2d3748;
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                border: 1px solid #e2e8f0;
                font-weight: 400;
            }
            .cta {
                text-align: center;
                margin: 50px 0;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 18px 40px;
                border-radius: 50px;
                font-weight: 700;
                font-size: 18px;
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 20px;
                margin: 40px 0;
            }
            .feature {
                text-align: center;
                padding: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                border: 1px solid #e2e8f0;
            }
            .feature-icon {
                font-size: 32px;
                margin-bottom: 10px;
            }
            .feature-text {
                font-size: 14px;
                color: #4a5568;
                font-weight: 600;
            }
            .footer {
                background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
                color: #e2e8f0;
                padding: 40px;
                text-align: center;
                font-size: 14px;
            }
            .social-links {
                margin: 25px 0;
                display: flex;
                justify-content: center;
                gap: 25px;
            }
            .social-links a {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 45px;
                height: 45px;
                background: rgba(255,255,255,0.1);
                color: #e2e8f0;
                text-decoration: none;
                font-weight: 600;
                border-radius: 50%;
                transition: all 0.3s ease;
                font-size: 16px;
            }
            .footer-brand {
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(255,255,255,0.1);
            }
            .footer-brand strong {
                font-size: 16px;
                color: #00d4ff;
            }
            @media (max-width: 600px) {
                body { padding: 10px; }
                .header, .content, .footer { padding: 30px 20px; }
                .subject-line { font-size: 24px; }
                .message { font-size: 16px; padding: 20px; }
                .logo-img { width: 60px; height: 60px; }
                .logo-text { font-size: 28px; }
                .social-links { flex-wrap: wrap; gap: 15px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-container">
                    <img src="https://cyberpit.live/logo.jpg" alt="CyberPiT Logo" class="logo-img" />
                    <div class="logo-text">CyberPiT</div>
                    <div class="tagline">Elite Cybersecurity Research & Innovation</div>
                </div>
            </div>
            
            <div class="content">
                <div class="subject-line">${subject}</div>
                
                <div class="message">${body}</div>
                
                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">🛡️</div>
                        <div class="feature-text">Security Research</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🔐</div>
                        <div class="feature-text">Penetration Testing</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🏆</div>
                        <div class="feature-text">CTF Challenges</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">👥</div>
                        <div class="feature-text">Elite Community</div>
                    </div>
                </div>
                
                <div class="cta">
                    <a href="https://cyberpit.live" class="cta-button">Explore CyberPiT</a>
                </div>
            </div>
            
            <div class="footer">
                <div class="social-links">
                    <a href="https://github.com/cyberpit" title="GitHub">⚡</a>
                    <a href="https://x.com/Cyberpitinc" title="Twitter">🐦</a>
                    <a href="https://linkedin.com/company/cyberpit" title="LinkedIn">💼</a>
                    <a href="https://cyberpit.live" title="Website">🌐</a>
                </div>
                
                <div class="footer-brand">
                    <strong>CyberPiT Team</strong><br>
                    Elite cybersecurity researchers, ethical hackers, and cyber defenders.<br>
                    From advanced CTF challenges to real-world security solutions — we lead the way.
                    <br><br>
                    <small style="opacity: 0.7;">
                        You received this email because you subscribed to CyberPiT updates.<br>
                        © 2025 CyberPiT. All rights reserved.
                    </small>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
};

export const sendBulkEmail = async (subscribers: string[], emailData: EmailData): Promise<EmailResult> => {
  const result: EmailResult = {
    success: true,
    sent: 0,
    failed: 0,
    errors: []
  };

  if (!process.env.BREVO_API_KEY) {
    console.error('❌ Brevo API key not found in environment variables');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.startsWith('BREVO')));
    result.success = false;
    result.errors.push('Brevo API key not configured');
    return result;
  }

  console.log('✅ Brevo API key found, length:', process.env.BREVO_API_KEY.length);

  const htmlContent = createEmailTemplate(emailData.subject, emailData.body);
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'administrator@cyberpit.live';
  const senderName = process.env.BREVO_SENDER_NAME || 'CyberPiT Team';

  // Process emails in batches to avoid rate limiting
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < subscribers.length; i += batchSize) {
    batches.push(subscribers.slice(i, i + batchSize));
  }

  console.log(`📧 Sending bulk email to ${subscribers.length} subscribers in ${batches.length} batches`);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`📨 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

    const promises = batch.map(async (email) => {
      try {
        const emailPayload = {
          sender: { name: senderName, email: senderEmail },
          to: [{ email }],
          subject: emailData.subject,
          htmlContent: htmlContent
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailPayload, {
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          }
        });

        result.sent++;
        console.log(`✅ Email sent successfully to: ${email} (ID: ${response.data.messageId})`);
      } catch (error: any) {
        result.failed++;
        const errorMsg = `Failed to send to ${email}: ${error.response?.data?.message || error.message}`;
        result.errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    });

    await Promise.all(promises);

    // Add delay between batches to respect rate limits
    if (batchIndex < batches.length - 1) {
      console.log('⏱️ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  result.success = result.failed === 0;
  console.log(`📊 Bulk email summary: ${result.sent} sent, ${result.failed} failed`);
  
  return result;
};

export default { sendBulkEmail };
