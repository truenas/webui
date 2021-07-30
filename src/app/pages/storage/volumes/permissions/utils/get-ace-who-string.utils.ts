import { NfsAclItem, PosixAclItem } from 'app/interfaces/acl.interface';

export function getAceWhoString(ace: NfsAclItem | PosixAclItem): string {
  if (ace.who) {
    return ace.who;
  }

  if (ace.id >= 0) {
    return String(ace.id);
  }

  return '?';
}
