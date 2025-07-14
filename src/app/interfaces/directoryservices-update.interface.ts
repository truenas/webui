import { DirectoryServicesConfig } from './directoryservices-config.interface';

export interface DirectoryServicesUpdate extends Omit<DirectoryServicesConfig, 'id'> {
  force: boolean;
}

export interface DirectoryServicesUpdateResponse {
  result: DirectoryServicesConfig;
}
