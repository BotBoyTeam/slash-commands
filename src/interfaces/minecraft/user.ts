import needle from 'needle';

export interface MinecraftUser {
  name: string;
  id: string;
}

export interface MinecraftName {
  name: string;
  changedToAt?: number;
}

const userCache = new Map<string, { c: number; i: string }>();
const namesCache = new Map<string, { c: number; n: MinecraftName[] }>();

const TTL = parseInt(process.env.API_CACHE_TTL!);

export function flushCache() {
  const now = Date.now();
  for (const id in userCache) {
    const user = userCache.get(id)!;
    if (user.c < now + TTL) userCache.delete(id);
  }
}

export async function getUser(username: string) {
  if (userCache.has(username)) return { name: username, id: userCache.get(username).i };

  try {
    const res = await needle('get', `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const user = res.body as MinecraftUser;
      userCache.set(user.name, {
        c: Date.now(),
        i: user.id
      });
      return user;
    } else {
      const res = await needle(
        'get',
        `https://api.mojang.com/user/profiles/${encodeURIComponent(username.replace(/-/g, ''))}/names`
      );
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const names = res.body as MinecraftName[];
        const name = [...names].reverse()[0].name;
        const id = username.replace(/-/g, '');
        userCache.set(name, { c: Date.now(), i: id });
        namesCache.set(id, { c: Date.now(), n: names });
        return { name, id };
      } else return new Error(`The service gave us a ${res.statusCode}! Try again later!`);
    }
  } catch (e) {
    return new Error('An error occurred with the API!');
  }
}

export async function getUserNames(id: string) {
  id = id.replace(/-/g, '');
  if (namesCache.has(id))
    return {
      names: namesCache.get(id).n,
      id
    };

  let skipUsername = false;
  if (userCache.has(id)) {
    id = userCache.get(id).i;
    skipUsername = true;
  }

  try {
    if (!skipUsername) {
      const res = await needle('get', `https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(id)}`);
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const user = res.body as MinecraftUser;
        userCache.set(user.name, {
          c: Date.now(),
          i: user.id
        });
        id = user.id;
      }
    }

    const res = await needle(
      'get',
      `https://api.mojang.com/user/profiles/${encodeURIComponent(id.replace(/-/g, ''))}/names`
    );
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const names = res.body as MinecraftName[];
      const name = [...names].reverse()[0].name;
      userCache.set(name, { c: Date.now(), i: id });
      namesCache.set(id, { c: Date.now(), n: names });
      return { names, id };
    } else return new Error(`The service gave us a ${res.statusCode}! Try again later!`);
  } catch (e) {
    return new Error('An error occurred with the API!');
  }
}
