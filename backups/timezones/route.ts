import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const timezones = await prisma.$queryRaw`
      SELECT name, abbrev, utc_offset
      FROM pg_timezone_names
      ORDER BY name;
    `;

    return new Response(JSON.stringify(timezones), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch timezones:', error);
    return new Response(JSON.stringify([]), { status: 500 });
  }
}
