import { directIdMapping } from 'app/interfaces/user.interface';

export interface IdMapping {
  name: string;
  systemId: number;
  hostUidOrGid: number;
  instanceUidOrGid: number | null | typeof directIdMapping;
}

export enum ViewType {
  Users = 'Users',
  Groups = 'Groups',
}
