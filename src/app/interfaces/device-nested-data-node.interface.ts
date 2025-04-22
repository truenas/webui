import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevItem } from 'app/interfaces/storage.interface';

export interface VDevGroup {
  group: string;
  guid: VDevType;
  children: VDevItem[];
  isRoot?: boolean;
  disk?: string;
}

export type VDevNestedDataNode = VDevItem | VDevGroup;

export function isVdevGroup(node: VDevNestedDataNode): node is VDevGroup {
  return 'group' in node;
}
