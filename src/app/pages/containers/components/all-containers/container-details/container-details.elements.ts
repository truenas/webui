import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const containerDetailsElements = {
  hierarchy: [T('Containers')],
  synonyms: [T('Containers'), T('Containers')],
  anchorRouterLink: ['/containers/view/def'],
  elements: {
    generalInfo: {
      hierarchy: [T('General Info')],
      anchor: 'general-info',
      inset: true,
    },
    usbDevices: {
      hierarchy: [T('USB Devices')],
      anchor: 'usb-devices',
      inset: true,
    },
    gpuDevices: {
      hierarchy: [T('GPU Devices')],
      anchor: 'gpu-devices',
      inset: true,
    },
    disks: {
      hierarchy: [T('Disks')],
      anchor: 'disks',
      inset: true,
    },
    nic: {
      hierarchy: [T('NIC')],
      anchor: 'nic',
      inset: true,
    },
    tools: {
      hierarchy: [T('Tools')],
      anchor: 'tools',
      inset: true,
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Vms],
} satisfies UiSearchableElement;
