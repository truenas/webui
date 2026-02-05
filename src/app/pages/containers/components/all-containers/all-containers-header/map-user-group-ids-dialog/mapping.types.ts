import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';

export enum MappingType {
  Users = 'users',
  Groups = 'groups',
}

export type MappedEntity = User | Group;

export interface TableRow {
  id: number;
  name: string;
  hostId: number;
  containerId: number | 'DIRECT';
}
