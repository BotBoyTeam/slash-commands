import { flushCache as flushSteamCache } from './interfaces/steam';
import { flushCache as flushMCCache } from './interfaces/minecraft';
import { CronJob } from 'cron';
import { logger } from '.';

function flushCaches() {
  flushSteamCache();
  flushMCCache();
  logger.debug('Flushed all caches.');
}

export const flushCron = new CronJob('0 * * * *', flushCaches);

export function startAll() {
  flushCron.start();
}
