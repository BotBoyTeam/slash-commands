import needle from 'needle';

interface AppListResponse {
  response: {
    apps: { appid: number; name: string; last_modified: number; price_change_number: number }[];
    have_more_results: boolean;
    last_appid: number;
  };
}

interface SteamStoreResponse {
  [appid: string]: {
    success: boolean;
    data: {
      type: string;
      name: string;
      steam_appid: number;
      required_age: number;
      is_free: boolean;
      dlc: number[];
      detailed_description: string;
      about_the_game: string;
      short_description: string;
      supported_languages: string;
      header_image: string;
      website: string;
      pc_requirements: {
        minimum: string;
        recommended?: string;
      };
      mac_requirements: {
        minimum: string;
        recommended?: string;
      };
      linux_requirements: string[];
      developers: string[];
      publishers: string[];
      demos: {
        appid: 410;
        description: '';
      }[];
      price_overview?: {
        currency: string;
        initial: number;
        final: number;
        discount_percent: number;
        initial_formatted: string;
        final_formatted: string;
      };
      packages: number[];
      package_groups: any[];
      platforms: {
        windows: boolean;
        mac: boolean;
        linux: boolean;
      };
      metacritic?: {
        score: number;
        url: string;
      };
      categories: {
        id: number;
        description: string;
      }[];
      genres: {
        id: string;
        description: string;
      }[];
      screenshots: {
        id: number;
        path_thumbnail: string;
        path_full: string;
      }[];
      movies: any[];
      recommendations: {
        total: number;
      };
      achievements: {
        total: number;
        highlighted: {
          name: string;
          path: string;
        }[];
      };
      release_date: {
        coming_soon: boolean;
        date: string;
      };
      support_info: {
        url: string;
        email: string;
      };
      background: string;
      content_descriptors: {
        ids: number[];
        notes: null;
      };
    };
  };
}

interface SteamDBPlayersResponse {
  success: boolean;
  data: {
    CurrentPlayers: number;
    MaxPlayers: number;
    MaxDailyPlayers: number;
    Followers: number;
    LastDepotUpdate: string;
  };
}

export let applist: AppListResponse['response']['apps'] = [];

export async function fetchAppList() {
  const key = process.env.STEAM_WEB_KEY;
  if (!key) {
    console.warn('STEAM_WEB_KEY is missing. Steam app list will not be refreshed.');
    return applist;
  }

  const apps: AppListResponse['response']['apps'] = [];
  let lastAppId: number | undefined;
  let hasMore = true;

  try {
    while (hasMore) {
      const query = new URLSearchParams({
        key,
        max_results: '50000'
      });

      if (lastAppId !== undefined) {
        query.set('last_appid', lastAppId.toString());
      }

      const res = await needle('get', `https://api.steampowered.com/IStoreService/GetAppList/v1/?${query.toString()}`);
      const data = (res.body as AppListResponse).response;

      if (!data) {
        break;
      }

      if (Array.isArray(data.apps)) {
        apps.push(...data.apps);
      }

      hasMore = Boolean(data.have_more_results);
      lastAppId = data.last_appid;

      if (hasMore && lastAppId === undefined) {
        break;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch Steam app list.', error);
    return applist;
  }

  applist = apps;
  return applist;
}

export async function fetchSteamApp(appid: number) {
  const res = await needle('get', `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=US`);
  const body = res.body as SteamStoreResponse;
  if (!body[appid.toString()].success) return false;
  return body[appid.toString()].data;
}

export async function fetchSteamPlayerCounts(appid: number) {
  const res = await needle('get', `https://steamdb.info/api/GetCurrentPlayers/?appid=${appid}`);
  const body = res.body as SteamDBPlayersResponse;
  if (!body.success) return false;
  return body.data;
}
