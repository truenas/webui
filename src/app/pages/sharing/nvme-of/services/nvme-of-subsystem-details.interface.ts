import { Overwrite } from 'utility-types';
import {
  NvmeOfHost,
  NvmeOfNamespace, NvmeOfPort,
  NvmeOfSubsystem,
} from 'app/interfaces/nvme-of.interface';

export type NvmeOfSubsystemDetails = Overwrite<NvmeOfSubsystem, {
  hosts: NvmeOfHost[];
  ports: NvmeOfPort[];
  namespaces: NvmeOfNamespace[];
}>;
