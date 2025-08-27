/**
 * Cloudflare Email Worker
 * Production-ready email service with MailChannels integration
 * Based on Agent Swarm findings for high deliverability
 */

export default {
  async fetch(request, env) {
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      // Verify authorization
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.substring(7);
      if (token !== env.EMAIL_API_KEY) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Parse request body
      const body = await request.json();
      const { to, subject, html, text, from, replyTo, template, variables } = body;

      // Validate required fields
      if (!to || !subject || (!html && !template)) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: to, subject, and either html or template' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Process template if provided
      let emailHtml = html;
      if (template) {
        emailHtml = await processTemplate(template, variables || {});
      }

      // Send email via MailChannels
      const mailChannelsRequest = new Request('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }],
            dkim_domain: env.DKIM_DOMAIN || 'recursionsystems.com',
            dkim_selector: env.DKIM_SELECTOR || 'mailchannels',
            dkim_private_key: env.DKIM_PRIVATE_KEY,
          }],
          from: {
            email: from || env.DEFAULT_FROM_EMAIL || 'noreply@recursionsystems.com',
            name: env.DEFAULT_FROM_NAME || 'RecursionSystems',
          },
          reply_to: replyTo ? { email: replyTo } : undefined,
          subject: subject,
          content: [
            {
              type: 'text/html',
              value: emailHtml,
            },
            {
              type: 'text/plain',
              value: text || stripHtml(emailHtml),
            },
          ],
        }),
      });

      const response = await fetch(mailChannelsRequest);
      
      if (!response.ok) {
        const error = await response.text();
        console.error('MailChannels error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to send email',
          details: error 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log success for monitoring
      await logEmailSent(env, { to, subject, template: template || 'custom' });

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Email sent successfully',
        messageId: crypto.randomUUID(),
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Email worker error:', error);
      return new Response(JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

/**
 * Process email templates
 */
async function processTemplate(templateName, variables) {
  const templates = {
    welcome: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to {{appName}}!</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>Thank you for joining us! We're excited to have you on board.</p>
              <a href="{{confirmLink}}" class="button">Confirm Your Email</a>
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <div class="footer">
                <p>© 2025 {{appName}}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    
    passwordReset: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi {{userName}},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <a href="{{resetLink}}" class="button">Reset Password</a>
              <p>This link will expire in 1 hour for security reasons.</p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
              <div class="footer">
                <p>© 2025 {{appName}}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,

    notification: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>{{subject}}</h1>
            </div>
            <div class="content">
              {{content}}
              <div class="footer">
                <p>© 2025 {{appName}}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  let html = templates[templateName] || templates.notification;
  
  // Replace variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, variables[key]);
  });

  return html;
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html) {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Log email sent for monitoring
 */
async function logEmailSent(env, data) {
  try {
    // Store in KV for analytics if available
    if (env.EMAIL_LOGS) {
      const key = `email:${Date.now()}:${crypto.randomUUID()}`;
      await env.EMAIL_LOGS.put(key, JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }), {
        expirationTtl: 60 * 60 * 24 * 30, // 30 days
      });
    }
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}