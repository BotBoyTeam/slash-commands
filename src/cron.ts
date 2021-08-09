import { flushCache as flushSteamCache } from './interfaces/steam';
import { flushCache as flushDDGCache } from './interfaces/ddg';
import { flushCache as flushMCServerCache } from './interfaces/minecraft/server';
import { flushCache as flushMCUserCache } from './interfaces/minecraft/user';
import { CronJob } from 'cron';
import { logger } from '.';

function flushCaches() {
  flushSteamCache();
  flushMCServerCache();
  flushMCUserCache();
  flushDDGCache();
  logger.debug('Flushed all caches.');
}

export const flushCron = new CronJob('0 * * * *', flushCaches);

export function startAll() {
  flushCron.start();
}
