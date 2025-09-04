# Gmail Setup Guide for Vale Equipment Management System

## Prerequisites

To use Gmail for sending emails from the Vale Equipment Management System, you need:

1. A Gmail account
2. 2-Factor Authentication enabled on your Gmail account
3. An App Password generated for the application

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the instructions to enable 2-Step Verification if not already enabled

### 2. Generate App Password

1. After enabling 2-Step Verification, go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "App passwords"
3. You might need to sign in again
4. At the bottom, click "Select app" and choose "Mail"
5. Click "Select device" and choose "Other (custom name)"
6. Type "Vale Equipment System" or similar
7. Click "Generate"
8. **Copy the 16-character password** (this is your App Password)

### 3. Configure Environment Variables

Create a `.env.local` file in your project root with:

```env
# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Email Recipients (Optional)
MAINTENANCE_EMAIL_RECIPIENTS=maintenance@yourcompany.com,supervisor@yourcompany.com
```

**Important Notes:**
- Use your full Gmail address for `GMAIL_USER`
- Use the 16-character App Password (not your regular Gmail password) for `GMAIL_APP_PASSWORD`
- Remove any spaces from the App Password
- Keep this information secure and never commit it to version control

### 4. Test Email Configuration

You can test the email configuration by:

1. Starting your development server:
   ```bash
   pnpm dev
   ```

2. Making a GET request to check email config:
   ```bash
   curl http://localhost:3000/api/send-email
   ```

3. Or submitting a form to trigger an email notification

## Troubleshooting

### Common Issues:

1. **"Invalid login"** error:
   - Make sure 2-Step Verification is enabled
   - Use App Password, not regular password
   - Verify the email address is correct

2. **"Less secure app access"** error:
   - This shouldn't happen with App Passwords
   - If it does, make sure you're using an App Password, not the regular password

3. **Connection timeout**:
   - Check your internet connection
   - Verify Gmail SMTP is not blocked by firewall

### Gmail SMTP Settings Used:
- **Server:** smtp.gmail.com
- **Port:** 587 (TLS) or 465 (SSL)
- **Security:** TLS/SSL
- **Authentication:** Required

## Security Best Practices

1. **Never share your App Password**
2. **Use environment variables** - never hardcode credentials
3. **Regularly rotate App Passwords** (every 6-12 months)
4. **Use a dedicated Gmail account** for system emails (recommended)
5. **Monitor sent emails** through Gmail's Sent folder

## Production Deployment

For production environments:

1. Use a dedicated Gmail account for the system
2. Set up proper environment variables on your hosting platform
3. Consider using Gmail's daily sending limits (500 emails/day for free accounts)
4. For high-volume needs, consider upgrading to Google Workspace

## Daily Sending Limits

- **Free Gmail:** 500 emails per day
- **Google Workspace:** 2,000 emails per day (Business/Enterprise)

If you exceed these limits, consider:
- Using multiple Gmail accounts
- Implementing email queuing
- Upgrading to Google Workspace
- Using a dedicated email service provider

## Support

If you encounter issues:
1. Check the Gmail setup guide above
2. Verify environment variables are set correctly
3. Check the application logs for specific error messages
4. Test with a simple email first before complex attachments

For Google-specific issues, refer to:
- [Gmail SMTP documentation](https://support.google.com/mail/answer/7126229)
- [App Passwords help](https://support.google.com/accounts/answer/185833)
