import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum ControllerType {
  Active = 'ACTIVE',
  Standby = 'STAND_BY',
}

export const controllerTypeLabels = new Map<ControllerType, string>([
  [ControllerType.Active, T('Active')],
  [ControllerType.Standby, T('Standby')],
]);
