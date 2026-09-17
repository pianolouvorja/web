import { getAuthSession } from "@/modules/auth/services/auth-client";

export type WeeklyTask = {
  id: number;
  description: string;
  bonus: number;
  done: boolean;
};

function communityBaseUrl(): string {
  const base = import.meta.env.VITE_PALCO_API_URL;
  if (base) return `${base.replace(/\/$/, '')}/v1/community`;
  return '/v1/community';
}

export async function getWeeklyTasks(): Promise<WeeklyTask[] | null> {
  const session = getAuthSession();
  if (!session) return null;
  try {
    const res = await fetch(`${communityBaseUrl()}/weekly-tasks`, {
      headers: { authorization: `Bearer ${session.token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as WeeklyTask[];
  } catch {
    return null;
  }
}