export type SeasonalEventBanner = {
  name: string;
  description: string | null;
  multiplier: number;
} | null;

function communityBaseUrl(): string {
  const base = import.meta.env.VITE_PALCO_API_URL;
  if (base) return `${base.replace(/\/$/, '')}/v1/community`;
  return '/v1/community';
}

export async function getSeasonalEvent(): Promise<SeasonalEventBanner> {
  try {
    const res = await fetch(`${communityBaseUrl()}/seasonal-event`);
    if (!res.ok) return null;
    return (await res.json()) as SeasonalEventBanner;
  } catch {
    return null;
  }
}