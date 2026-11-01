import { ok } from '@/server/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return ok({ status: 'up', time: new Date().toISOString() });
}
