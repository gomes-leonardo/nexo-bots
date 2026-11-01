import { impostorService } from '@/server/modules/impostor';
import { handle, ok } from '@/server/lib/http';

export const GET = handle(async () => ok(await impostorService.getThemeSummaries()));
