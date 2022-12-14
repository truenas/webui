import { AclType } from 'app/enums/acl-type.enum';

export interface SaveAsPresetModalConfig {
  aclType: AclType;
  datasetPath: string;
}
