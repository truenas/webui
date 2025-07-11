import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';

export interface DirectoryServicesStatus {
  type: DirectoryServiceType | null;
  status: DirectoryServiceStatus | null;
  status_msg: string | null;
}
