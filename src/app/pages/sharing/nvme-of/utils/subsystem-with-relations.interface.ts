import { NvmeOfHost, NvmeOfPort, NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';

export interface SubsystemWithRelations extends NvmeOfSubsystem {
  ports: NvmeOfPort[];
  hosts: NvmeOfHost[];
}
