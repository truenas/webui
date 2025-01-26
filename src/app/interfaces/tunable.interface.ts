export interface Tunable {
  comment: string;
  enabled: boolean;
  id: number;
  type: string;
  value: string;
  var: string;
  orig_value?: string;
}

export type TunableCreate = Omit<Tunable, 'id'>;
export type TunableUpdate = Pick<Tunable, 'value' | 'comment' | 'enabled'>;
