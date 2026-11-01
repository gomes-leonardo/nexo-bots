export interface NumberCategory {
  id: string;
  name: string;
  /** Instrução curta mostrada durante a mímica. */
  prompt: string;
  min: number;
  max: number;
  /** Texto antes do número (ex.: "R$ "). */
  prefix?: string;
  /** Texto depois do número (ex.: " °C"). */
  suffix?: string;
}
