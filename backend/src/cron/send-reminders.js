import { sendWeeklyReminders } from '../services/reminders.js'
import { logger } from '../utils/logger.js'

const result = await sendWeeklyReminders()
logger(`Reminder sweep complete: ${JSON.stringify(result)}`)
