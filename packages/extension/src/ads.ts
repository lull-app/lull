export interface Ad {
  name: string;
  logo: string;
  color: string;
  tagline: string;
  ctaText: string;
  ctaUrl: string;
}

export const DEMO_ADS: Ad[] = [
  { name: 'Supabase', logo: 'S', color: '#3ecf8e', tagline: "Postgres, but you'll actually ship this weekend.", ctaText: 'Start free →', ctaUrl: 'https://supabase.com' },
  { name: 'Railway',  logo: 'R', color: '#b835ff', tagline: 'Deploy any project in seconds. No DevOps required.', ctaText: 'Deploy now →', ctaUrl: 'https://railway.app' },
  { name: 'Fly.io',   logo: '✈', color: '#7b61ff', tagline: 'Run your apps close to your users. Globally.', ctaText: 'Get started →', ctaUrl: 'https://fly.io' },
  { name: 'Resend',   logo: '✉', color: '#f97316', tagline: 'The email API devs actually love. Ship faster.', ctaText: 'Try free →', ctaUrl: 'https://resend.com' },
  { name: 'Linear',   logo: 'L', color: '#5e6ad2', tagline: 'The issue tracker built for high-performance teams.', ctaText: 'See Linear →', ctaUrl: 'https://linear.app' },
];

let demoIndex = 0;

export function nextDemoAd(): Ad {
  const ad = DEMO_ADS[demoIndex % DEMO_ADS.length];
  demoIndex++;
  return ad;
}

export async function fetchAd(backendUrl: string): Promise<Ad | null> {
  try {
    const res = await fetch(`${backendUrl}/ad`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json() as Ad;
  } catch {
    return null;
  }
}
