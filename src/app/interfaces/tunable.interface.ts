import { TunableType } from 'app/enums/tunable-type.enum';

export interface Tunable {
  comment: string;
  enabled: boolean;
  id: number;
  type: TunableType;
  value: string;
  var: string;
}

export type TunableCreate = Omit<Tunable, 'id'>;
export type TunableUpdate = Pick<Tunable, 'value' | 'comment' | 'enabled'>;
