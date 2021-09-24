import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface Bootenv {
  activated: boolean;
  active: string;
  can_activate: boolean;
  created: ApiTimestamp;
  id: string;
  keep: boolean;
  mountpoint: string;
  name: string;
  rawspace: number;
  realname: string;
  space: string;
}

export type SetBootenvAttributeParams = [
  name: string,
  attributes: Partial<Bootenv>,
];

export interface CloneBootenvParams {
  name: string;
  source?: string;
}

export type UpdateBootenvParams = [
  name: string,
  updates:{ name: string },
];
