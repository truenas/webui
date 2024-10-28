import { BootEnvironmentActive } from 'app/enums/boot-environment-active.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface Bootenv {
  activated: boolean;
  active: BootEnvironmentActive;
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

export type CreateBootenvParams = [{
  name: string;
  source?: string;
}];

export type UpdateBootenvParams = [
  name: string,
  updates: { name: string },
];

export interface BootenvTooltip {
  name: string;
  source?: string;
}
