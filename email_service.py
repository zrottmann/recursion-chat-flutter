"""
Email Service - Send password reset and other transactional emails
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@tradingpost.com")
APP_URL = os.getenv("APP_URL", "http://localhost:3000")


async def send_password_reset_email(email: str, username: str, reset_token: str) -> bool:
    """
    Send password reset email with secure token
    """
    try:
        reset_url = f"{APP_URL}/reset-password?token={reset_token}"

        # Create email content
        subject = "Password Reset Request - Trading Post"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #007bff; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f4f4f4; padding: 20px; margin-top: 20px; }}
                .button {{ 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background: #007bff; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{ margin-top: 30px; text-align: center; color: #666; font-size: 12px; }}
                .warning {{ background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 15px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Password Reset Request</h2>
                </div>
                
                <div class="content">
                    <p>Hi {username},</p>
                    
                    <p>We received a request to reset your password for your Trading Post account.</p>
                    
                    <p>Click the button below to reset your password:</p>
                    
                    <center>
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </center>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: white; padding: 10px; border: 1px solid #ddd;">
                        {reset_url}
                    </p>
                    
                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong><br>
                        • This link will expire in 1 hour<br>
                        • If you didn't request this, please ignore this email<br>
                        • Never share this link with anyone
                    </div>
                </div>
                
                <div class="footer">
                    <p>This is an automated message from Trading Post.</p>
                    <p>Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        text_body = f"""
        Password Reset Request - Trading Post
        
        Hi {username},
        
        We received a request to reset your password for your Trading Post account.
        
        Click this link to reset your password:
        {reset_url}
        
        This link will expire in 1 hour.
        
        If you didn't request this password reset, please ignore this email.
        
        Security Notice:
        - Never share this link with anyone
        - This link expires in 1 hour
        - If you didn't request this, no action is needed
        
        This is an automated message from Trading Post.
        Please do not reply to this email.
        """

        # Send email
        if SMTP_USER and SMTP_PASSWORD:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = FROM_EMAIL
            msg["To"] = email

            # Add both text and HTML parts
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Send via SMTP
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(f"Password reset email sent to {email}")
            return True
        else:
            # Email not configured - log the reset URL for development
            logger.warning(f"Email not configured. Reset URL for {email}: {reset_url}")
            return False

    except Exception as e:
        logger.error(f"Failed to send password reset email: {str(e)}")
        return False


async def send_welcome_email(email: str, username: str) -> bool:
    """
    Send welcome email to new users
    """
    try:
        subject = "Welcome to Trading Post!"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #28a745; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f4f4f4; padding: 20px; margin-top: 20px; }}
                .button {{ 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background: #28a745; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{ margin-top: 30px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Welcome to Trading Post! 🎉</h2>
                </div>
                
                <div class="content">
                    <p>Hi {username},</p>
                    
                    <p>Welcome to Trading Post - Your local marketplace for trading goods and services!</p>
                    
                    <h3>Get Started:</h3>
                    <ul>
                        <li>Browse listings in your area</li>
                        <li>Post items you want to trade</li>
                        <li>Connect with other traders</li>
                        <li>Use AI to match your items with others</li>
                    </ul>
                    
                    <center>
                        <a href="{APP_URL}" class="button">Start Trading</a>
                    </center>
                </div>
                
                <div class="footer">
                    <p>Happy trading!</p>
                    <p>The Trading Post Team</p>
                </div>
            </div>
        </body>
        </html>
        """

        if SMTP_USER and SMTP_PASSWORD:
            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["From"] = FROM_EMAIL
            msg["To"] = email
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

            logger.info(f"Welcome email sent to {email}")
            return True
        else:
            logger.warning(f"Email not configured. Welcome email not sent to {email}")
            return False

    except Exception as e:
        logger.error(f"Failed to send welcome email: {str(e)}")
        return False
