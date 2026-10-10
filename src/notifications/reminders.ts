/**
 * Daily practice reminders via expo-notifications.
 *
 * Local scheduled notifications only — these work in Expo Go (per the
 * SDK 57 docs, only *remote* push notifications need a dev build).
 * One daily reminder at the user's chosen local time; the copy gently
 * reflects the current streak. Quiet by design: one notification,
 * one line, no nagging.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Foreground behavior: show the banner quietly, no sound, no badge.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const DAILY_IDENTIFIER = 'daily-practice';
const CHANNEL_ID = 'practice-reminders';

export type ReminderPermission = 'granted' | 'denied' | 'undetermined';

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Practice reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 120, 120, 120],
    });
  } catch {
    // Channel creation is best-effort; scheduling still works on most devices.
  }
}

/**
 * The channel must exist before requesting permission on Android 13+,
 * otherwise the OS permission prompt never appears.
 */
export async function requestReminderPermission(): Promise<boolean> {
  try {
    await ensureChannel();
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function getReminderPermission(): Promise<ReminderPermission> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

function reminderBody(streakDays: number): string {
  if (streakDays >= 2) return `${streakDays}-day streak — keep it breathing.`;
  return 'Time for your daily breath.';
}

/**
 * (Re)schedule the single daily reminder. Cancels any previous one first,
 * so calling this repeatedly is safe — e.g. to refresh the streak copy
 * each time the app is opened.
 */
export async function scheduleDailyReminder(
  hour24: number,
  minute: number,
  streakDays: number,
): Promise<void> {
  await cancelDailyReminder();
  try {
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_IDENTIFIER,
      content: {
        title: 'Prana Pacer',
        body: reminderBody(streakDays),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hour24,
        minute,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
  } catch {
    // Scheduling is best-effort; the app works fine without it.
  }
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_IDENTIFIER);
  } catch {
    // ignore
  }
}
