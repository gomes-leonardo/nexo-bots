import type { NumberCategory } from './types';

export const CATEGORIES: readonly NumberCategory[] = [
  { id: 'temperatura', name: 'Temperatura', prompt: 'Mostre o calor ou o frio que está fazendo', min: 10, max: 40, suffix: ' °C' },
  { id: 'idade', name: 'Idade', prompt: 'Mostre a idade de alguém', min: 1, max: 99, suffix: ' anos' },
  { id: 'nota', name: 'Nota', prompt: 'Mostre uma nota de 0 a 10', min: 0, max: 10 },
  { id: 'preco', name: 'Preço', prompt: 'Mostre quanto custa alguma coisa', min: 1, max: 100, prefix: 'R$ ' },
  { id: 'porcentagem', name: 'Bateria do celular', prompt: 'Mostre quanto de bateria sobrou', min: 1, max: 100, suffix: '%' },
  { id: 'hora', name: 'Hora do dia', prompt: 'Mostre que horas são', min: 0, max: 23, suffix: 'h' },
  { id: 'livre', name: 'De 1 a 100', prompt: 'Qualquer número de 1 a 100', min: 1, max: 100 },
];
