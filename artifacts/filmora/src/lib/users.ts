import type { SessionUser } from "@/lib/authServer";

/**
 * User persistence. Uses MongoDB when MONGODB_URI is set (same cluster that
 * holds the movie catalogue), otherwise an in-memory map so the site still
 * runs in demo mode.
 */

export interface StoredUser extends SessionUser {
  email: string;
  name: string;
  picture?: string;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
}

const mem = globalThis as unknown as { __mbUsers?: Map<string, StoredUser> };
const memUsers: Map<string, StoredUser> = mem.__mbUsers ?? new Map();
mem.__mbUsers = memUsers;

async function collection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  try {
    const { MongoClient } = await import("mongodb");
    const cache = globalThis as unknown as { __mbMongo?: Promise<InstanceType<typeof MongoClient>> };
    if (!cache.__mbMongo) cache.__mbMongo = new MongoClient(uri).connect();
    const client = await cache.__mbMongo;
    return client.db(process.env.MONGODB_DB ?? "moviebox").collection<StoredUser>("users");
  } catch {
    return null;
  }
}

export async function upsertUser(user: SessionUser): Promise<StoredUser> {
  const email = user.email.toLowerCase();
  const now = new Date().toISOString();
  const col = await collection();

  if (col) {
    const existing = await col.findOne({ email });
    const doc: StoredUser = {
      email,
      name: user.name || existing?.name || email.split("@")[0],
      picture: user.picture ?? existing?.picture,
      createdAt: existing?.createdAt ?? now,
      lastLoginAt: now,
      loginCount: (existing?.loginCount ?? 0) + 1,
    };
    await col.updateOne({ email }, { $set: doc }, { upsert: true });
    return doc;
  }

  const existing = memUsers.get(email);
  const doc: StoredUser = {
    email,
    name: user.name || existing?.name || email.split("@")[0],
    picture: user.picture ?? existing?.picture,
    createdAt: existing?.createdAt ?? now,
    lastLoginAt: now,
    loginCount: (existing?.loginCount ?? 0) + 1,
  };
  memUsers.set(email, doc);
  return doc;
}

export async function getUser(email: string): Promise<StoredUser | null> {
  const key = email.toLowerCase();
  const col = await collection();
  if (col) return (await col.findOne({ email: key })) ?? null;
  return memUsers.get(key) ?? null;
}
