import { DirectoryServicesConfigResponse } from './directoryservices-config.interface';

export interface DirectoryServicesUpdate extends Omit<DirectoryServicesConfigResponse, 'id'> {
  force: boolean;
}

export interface DirectoryServicesUpdateResponse {
  result: DirectoryServicesConfigResponse;
}
