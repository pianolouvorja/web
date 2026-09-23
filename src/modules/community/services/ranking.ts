import { getAuthSession } from "@/modules/auth/services/auth-client";

export type RankingWindow = "week" | "all";

export type RankingEntry = {
  user_id: number;
  display_name: string;
  position: number;
  total: number;
};

export type MyPosition = {
  position: number | null;
  total: number;
};

function communityBaseUrl(): string {
  const base = import.meta.env.VITE_PALCO_API_URL;
  if (base) return `${base.replace(/\/$/, '')}/v1/community`;
  return '/v1/community';
}

export async function getRanking(
  window: RankingWindow,
): Promise<RankingEntry[]> {
  const res = await fetch(`${communityBaseUrl()}/ranking?window=${window}`);
  if (!res.ok) return [];
  return (await res.json()) as RankingEntry[];
}

export async function getMyPosition(
  window: RankingWindow,
  token: string | null,
): Promise<MyPosition> {
  if (!token) return { position: null, total: 0 };
  try {
    const res = await fetch(`${communityBaseUrl()}/ranking/me?window=${window}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { position: null, total: 0 };
    return (await res.json()) as MyPosition;
  } catch {
    return { position: null, total: 0 };
  }
}

export async function registerUse(
  collectionId: number,
  token: string | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`${communityBaseUrl()}/collections/use`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ collectionId }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function reportCollection(
  collectionId: number,
  reason: string,
  token: string | null,
): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`${communityBaseUrl()}/collections/report`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ collectionId, reason }),
    });
    return res.ok;
  } catch {
    return false;
  }
}