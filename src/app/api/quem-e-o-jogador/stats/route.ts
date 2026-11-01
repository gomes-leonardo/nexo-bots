import { quemEOJogadorService } from '@/server/modules/quem-e-o-jogador';
import { handle, ok } from '@/server/lib/http';

export const GET = handle(async () => ok(await quemEOJogadorService.getStats()));
