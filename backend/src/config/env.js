export const env = {
  port: Number(process.env.PORT || 3001),
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  frontendUrl: process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  reminderCronSecret: process.env.REMINDER_CRON_SECRET || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  reminderFromEmail: process.env.REMINDER_FROM_EMAIL || '',
  appName: process.env.APP_NAME || 'BlueApp',
}
