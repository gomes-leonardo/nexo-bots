import { mostraNumeroService } from '@/server/modules/mostra-numero';
import { handle, ok } from '@/server/lib/http';

export const GET = handle(async () => ok(await mostraNumeroService.getCategories()));
