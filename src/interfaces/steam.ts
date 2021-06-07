import needle from 'needle';

export type SteamProfileCountType =
  | 'badges'
  | 'games'
  | 'groups'
  | 'reviews'
  | 'friends'
  | 'screenshots'
  | 'workshop_files'
  | 'guides'
  | 'artwork'
  | 'videos';

export type SteamProfileBanType = 'none' | 'one' | 'multiple';

export type SteamProfileStatusState = 'offline' | 'online' | 'in-game';

export interface SteamIntegerFormat {
  estimate: string;
  formatted: string;
  value: number;
}

export interface SteamProfileError {
  error: string;
  ok: false;
}

export interface SteamPrivateProfile {
  avatar: string;
  ok: true;
  private: true;
  username: string;
  bans: {
    community: boolean;
    days_since_last: SteamIntegerFormat | null;
    game: SteamProfileBanType;
    trade: boolean;
    vac: SteamProfileBanType;
  };
  steamid: {
    '2': string;
    '3': string;
    '32': number;
    '64': string;
  };
  custom_url: string | null;
}

export interface SteamBadge {
  image: string;
  meta: string;
  name: string;
  url: string;
  xp: SteamIntegerFormat;
}

export interface SteamPrimaryGroup {
  member_count: SteamIntegerFormat;
  name: string;
  url: string;
}

export interface SteamRecentActivity {
  games: SteamRecentActivityGame[];
  playtime: SteamIntegerFormat;
}

export interface SteamRecentActivityGame {
  achievement_progress: {
    completed: SteamIntegerFormat;
    total: SteamIntegerFormat;
  };
  banner_image: string;
  hours: SteamIntegerFormat;
  last_played: 'in-game' | string;
  name: string;
  url: string;
}

export interface SteamPublicProfile extends Omit<SteamPrivateProfile, 'private'> {
  animated_background_url: string | null;
  avatar: string;
  avatar_border_url: string | null;
  background_url: string | null;
  badge: SteamBadge | null;
  bans: {
    community: boolean;
    days_since_last: SteamIntegerFormat | null;
    game: SteamProfileBanType;
    trade: boolean;
    vac: SteamProfileBanType;
  };
  can_comment: boolean;
  counts: {
    [key: string]: SteamIntegerFormat | null;
  };
  created: number;
  flag: string | null;
  level: SteamIntegerFormat;
  primary_group: SteamPrimaryGroup | null;
  private: false;
  real_name: string;
  recent_activity: SteamRecentActivity;
  status: {
    state: SteamProfileStatusState;
    game?: string;
    server_ip?: string;
  };
  summary: {
    raw: string;
    text: string;
  };
  username: string;
}

export type SteamProfile = SteamPrivateProfile | SteamPublicProfile;
export type SteamProfileResult = SteamProfile | SteamProfileError;

export interface SteamAlias {
  newname: string;
  timechanged: string;
}

const profileCache = new Map<string, { c: number; p: SteamProfile }>();
const profileAliasesCache = new Map<string, { c: number; a: SteamAlias[] }>();
const profileCustomURLCache = new Map<string, { c: number; i: string }>();

const TTL = parseInt(process.env.API_CACHE_TTL!);

export function flushCache() {
  const now = Date.now();
  for (const id in profileCache) {
    const profile = profileCache.get(id)!;
    if (profile.c < now + TTL) profileCache.delete(id);
  }
  for (const id in profileAliasesCache) {
    const profile = profileAliasesCache.get(id)!;
    if (profile.c < now + TTL) profileAliasesCache.delete(id);
  }
  for (const id in profileCustomURLCache) {
    const customURL = profileCustomURLCache.get(id)!;
    if (customURL.c < now + TTL * 2) profileCustomURLCache.delete(id);
  }
}

export async function getProfile(id: string) {
  // Cached Custom URL
  if (profileCustomURLCache.has(id.toLowerCase())) id = profileCustomURLCache.get(id.toLowerCase()).i;

  // Cached ID
  if (profileCache.has(id)) return profileCache.get(id).p;

  try {
    const res = await needle('get', `https://api.snaz.in/v2/steam/user-profile/${encodeURIComponent(id)}`, {
      open_timeout: 2000,
      response_timeout: 1000,
      read_timeout: 1000
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const profile = res.body as SteamProfile;
      profileCache.set(profile.steamid['64'], {
        c: Date.now(),
        p: profile
      });
      if (profile.custom_url)
        profileCustomURLCache.set(profile.custom_url.toLowerCase(), {
          c: Date.now(),
          i: profile.steamid['64']
        });
      return profile;
    } else
      throw new Error(
        (res.body as SteamProfileError).error || `The service gave us a ${res.statusCode}! Try again later!`
      );
  } catch (e) {
    throw new Error('An error occurred with the API!');
  }
}

export async function getProfileAliases(id: string) {
  // Cached Custom URL
  if (profileCustomURLCache.has(id.toLowerCase())) id = profileCustomURLCache.get(id.toLowerCase()).i;

  // Cached ID
  if (profileAliasesCache.has(id)) return profileAliasesCache.get(id).a;

  try {
    const res = await needle('get', `https://steamcommunity.com/profiles/${encodeURIComponent(id)}/ajaxaliases/`, {
      open_timeout: 2000,
      response_timeout: 1000,
      read_timeout: 1000
    });
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.includes('The specified profile could not be found.'))
        throw new Error('That profile could not be found!');
      const aliases = res.body as SteamAlias[];
      profileAliasesCache.set(id, {
        c: Date.now(),
        a: aliases
      });
      return aliases;
    } else throw new Error(`The service gave us a ${res.statusCode}! Try again later!`);
  } catch (e) {
    throw new Error('An error occurred with the API!');
  }
}
