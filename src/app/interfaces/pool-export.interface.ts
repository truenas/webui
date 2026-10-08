import { isObject } from 'lodash-es';

export interface ServicesToBeRestartedInfo {
  stop_services: string[];
  restart_services: string[];
}

export function isServicesToBeRestartedInfo(extra: unknown): extra is ServicesToBeRestartedInfo {
  return isObject(extra)
    && !Array.isArray(extra)
    && 'code' in extra
    && extra.code === 'control_services';
}
