import needle from 'needle';

export interface MinecraftOfflineServer {
  ip: string;
  port: number;
  debug: {
    ping: boolean;
    query: boolean;
    srv: boolean;
    querymismatch: boolean;
    ipinsrv: boolean;
    cnameinsrv: boolean;
    animatedmotd: boolean;
    cachetime: number;
    apiversion: 2;
  };
  online: false;
  hostname?: string;
}

export interface MinecraftOnlineServer extends Omit<MinecraftOfflineServer, 'online'> {
  motd: {
    raw: string[];
    clean: string[];
    html: string[];
  };
  players: {
    online: number;
    max: number;
    list?: string[];
    uuid?: { [key: string]: string };
  };
  version: string;
  online: true;
  protocol?: number;
  icon?: string;
  software?: string;
  map?: string;
  plugins?: {
    names: string[];
    raw: string[];
  };
  mods?: {
    names: string[];
    raw: string[];
  };
  info?: {
    raw: string[];
    clean: string[];
    html: string[];
  };
}

export interface MinecraftOnlineBedrockServer extends Omit<MinecraftOnlineServer, 'players' | 'protocol'> {
  players: {
    online: string;
    max: string;
  };
  protocol?: string;
}

export type MinecraftServer = MinecraftOfflineServer | MinecraftOnlineServer;
export type MinecraftBedrockServer = MinecraftOfflineServer | MinecraftOnlineBedrockServer;
export type AnyMinecraftServer = MinecraftServer | MinecraftBedrockServer;

const serverCache = new Map<string, { c: number; s: MinecraftServer }>();
const serverAliasCache = new Map<string, { c: number; h: string }>();
const bedrockServerCache = new Map<string, { c: number; s: MinecraftBedrockServer }>();
const bedrockServerAliasCache = new Map<string, { c: number; h: string }>();

const TTL = parseInt(process.env.API_CACHE_TTL!);

export function flushCache() {
  const now = Date.now();
  for (const id in serverCache) {
    const server = serverCache.get(id)!;
    if (server.c < now + TTL) serverCache.delete(id);
  }
  for (const id in serverAliasCache) {
    const alias = serverAliasCache.get(id)!;
    if (alias.c < now + TTL * 2) serverAliasCache.delete(id);
  }
  for (const id in bedrockServerCache) {
    const server = bedrockServerCache.get(id)!;
    if (server.c < now + TTL) bedrockServerCache.delete(id);
  }
  for (const id in bedrockServerAliasCache) {
    const alias = bedrockServerAliasCache.get(id)!;
    if (alias.c < now + TTL * 2) bedrockServerAliasCache.delete(id);
  }
}

export async function getServer(hostname: string, bedrock = false) {
  const cache = bedrock ? bedrockServerCache : serverCache;
  const aliasCache = bedrock ? bedrockServerAliasCache : serverAliasCache;

  // Get cache
  hostname = hostname.toLowerCase();
  if (aliasCache.has(hostname)) hostname = aliasCache.get(hostname).h;
  if (cache.has(hostname)) return cache.get(hostname).s;

  try {
    const res = await needle(
      'get',
      `https://api.mcsrvstat.us/${bedrock ? 'bedrock/' : ''}2/${encodeURIComponent(hostname)}`,
      {
        open_timeout: 5000,
        response_timeout: 5000,
        read_timeout: 5000
      }
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const server = res.body as AnyMinecraftServer;
      if (server.ip === '127.0.0.1') {
        cache.set(server.hostname, {
          c: Date.now(),
          s: server as any
        });
      } else {
        cache.set(server.ip, {
          c: Date.now(),
          s: server as any
        });
        if (server.ip !== hostname)
          aliasCache.set(hostname, {
            c: Date.now(),
            h: server.ip
          });
        if (server.hostname)
          aliasCache.set(server.hostname.toLowerCase(), {
            c: Date.now(),
            h: server.ip
          });
      }
      return server;
    } else return new Error(`The service gave us a ${res.statusCode}! Try again later!`);
  } catch (e) {
    return new Error('An error occurred with the API!');
  }
}
