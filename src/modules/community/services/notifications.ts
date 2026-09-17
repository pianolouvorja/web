import { getAuthSession } from "@/modules/auth/services/auth-client";

export type AppNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  created_at: string;
};

function communityBaseUrl(): string {
  const base = import.meta.env.VITE_PALCO_API_URL;
  if (base) return `${base.replace(/\/$/, '')}/v1/community`;
  return '/v1/community';
}

export async function getNotifications(): Promise<AppNotification[]> {
  const session = getAuthSession();
  if (!session) return [];
  const token = session.token;
  try {
    const res = await fetch(`${communityBaseUrl()}/notifications`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as AppNotification[];
  } catch {
    return [];
  }
}

export function markAllRead(): void {
  // no-op: backend marca como lido ao buscar; frontend só limpa local
}