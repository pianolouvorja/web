import { getAuthSession } from "@/modules/auth/services/auth-client";

export type CommunityCollectionSummary = {
  id: number;
  name: string;
  authorName: string | null;
  authorId: number;
  musicsCount: number;
  coverUrl: string | null;
  createdAt: string;
};

export type CommunityPageResult = {
  items: CommunityCollectionSummary[];
  page: number;
  lastPage: number;
  total: number;
};

function communityBaseUrl(): string {
  const base = import.meta.env.VITE_PALCO_API_URL;
  if (base) return `${base.replace(/\/$/, '')}/v1/community`;
  return '/v1/community';
}

export async function listCommunityCollectionsPage(
  page: number,
  perPage: number,
): Promise<CommunityPageResult> {
  const url = `${communityBaseUrl()}/collections?page=${page}&per_page=${perPage}`;
  const res = await fetch(url);
  if (!res.ok) return { items: [], page, lastPage: 1, total: 0 };
  return (await res.json()) as CommunityPageResult;
}

export async function saveCommunityCopy(
  collection: CommunityCollectionSummary,
): Promise<number | null> {
  const session = getAuthSession();
  if (!session) return null;
  const token = session.token;
  try {
    const res = await fetch(`${communityBaseUrl()}/collections/copy`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sourceCollectionId: collection.id }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { id: number };
    return json.id;
  } catch {
    return null;
  }
}