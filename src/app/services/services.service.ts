import { Injectable } from '@angular/core';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';

@Injectable({
  providedIn: 'root',
})
export class ServicesService {
  /**
   * Roles required to manage a service.
   */
  getRolesRequiredToManage(serviceName: ServiceName): Role[] {
    switch (serviceName) {
      case ServiceName.Ftp:
        return [Role.SharingFtpWrite, Role.ServiceWrite];
      case ServiceName.Cifs:
        return [Role.SharingSmbWrite, Role.ServiceWrite];
      case ServiceName.Iscsi:
        return [Role.SharingIscsiWrite, Role.ServiceWrite];
      case ServiceName.Nfs:
        return [Role.SharingNfsWrite, Role.ServiceWrite];
      default:
        return [Role.ServiceWrite];
    }
  }
}
