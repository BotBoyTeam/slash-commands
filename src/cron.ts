import { flushCache as flushSteamCache } from './interfaces/steam';
import { flushCache as flushMCServerCache } from './interfaces/minecraft/server';
import { CronJob } from 'cron';
import { logger } from '.';

function flushCaches() {
  flushSteamCache();
  flushMCServerCache();
  logger.debug('Flushed all caches.');
}

export const flushCron = new CronJob('0 * * * *', flushCaches);

export function startAll() {
  flushCron.start();
}
