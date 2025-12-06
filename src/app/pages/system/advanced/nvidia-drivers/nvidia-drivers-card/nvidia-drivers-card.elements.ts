import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const nvidiaDriversCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('NVIDIA Drivers')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    nvidiaDrivers: {
      anchor: 'nvidia-drivers',
    },
    configure: {
      anchor: 'nvidia-drivers-settings',
      hierarchy: [T('Configure NVIDIA Drivers')],
      synonyms: [T('NVIDIA Driver Settings'), T('GPU Drivers')],
    },
    installNvidiaDrivers: {
      hierarchy: [T('Install NVIDIA Drivers')],
    },
  },
} satisfies UiSearchableElement;
