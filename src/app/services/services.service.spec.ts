import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(() => {
    service = new ServicesService();
  });

  describe('getRolesRequiredToManage', () => {
    it('should return FTP sharing roles for FTP service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Ftp);
      expect(roles).toEqual([Role.SharingFtpWrite, Role.ServiceWrite]);
    });

    it('should return SMB sharing roles for CIFS service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Cifs);
      expect(roles).toEqual([Role.SharingSmbWrite, Role.ServiceWrite]);
    });

    it('should return iSCSI sharing roles for iSCSI service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Iscsi);
      expect(roles).toEqual([Role.SharingIscsiWrite, Role.ServiceWrite]);
    });

    it('should return NFS sharing roles for NFS service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Nfs);
      expect(roles).toEqual([Role.SharingNfsWrite, Role.ServiceWrite]);
    });

    it('should return NVMe-oF sharing roles for NVMe-oF service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.NvmeOf);
      expect(roles).toEqual([Role.SharingNvmeTargetWrite, Role.ServiceWrite]);
    });

    it('should return default ServiceWrite role for SSH service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Ssh);
      expect(roles).toEqual([Role.ServiceWrite]);
    });

    it('should return default ServiceWrite role for SNMP service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Snmp);
      expect(roles).toEqual([Role.ServiceWrite]);
    });

    it('should return default ServiceWrite role for UPS service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Ups);
      expect(roles).toEqual([Role.ServiceWrite]);
    });

    it('should return default ServiceWrite role for HTTP service', () => {
      const roles = service.getRolesRequiredToManage(ServiceName.Http);
      expect(roles).toEqual([Role.ServiceWrite]);
    });

    it('should return default ServiceWrite role for unknown service', () => {
      const roles = service.getRolesRequiredToManage('unknown-service' as ServiceName);
      expect(roles).toEqual([Role.ServiceWrite]);
    });
  });
});
