import { AclFlag } from 'app/enums/acl-flags.enum';

export type AclFlags = { [K in AclFlag]: boolean };
