import { Permission } from 'app/enums/permission.enum';

export type Permissions = { [K in Permission]: boolean };
