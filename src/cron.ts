import { flushCache as flushSteamCache } from './interfaces/steam';
import { CronJob } from 'cron';

function flushCaches() {
  flushSteamCache();
}

export const flushCron = new CronJob('0 * * * *', flushCaches);

export function startAll() {
  flushCron.start();
}
