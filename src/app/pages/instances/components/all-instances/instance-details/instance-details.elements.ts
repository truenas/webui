import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { GlobalSearchVisibleToken } from 'app/modules/global-search/enums/global-search-visible-token.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const instanceDetailsElements = {
  hierarchy: [T('Instances')],
  synonyms: [T('VM'), T('Virtual Machines'), T('Instances'), T('Virtualization'), T('Containers')],
  anchorRouterLink: ['/instances/view/def'],
  elements: {
    generalInfo: {
      hierarchy: [T('General Info')],
      anchor: 'general-info',
    },
    devices: {
      hierarchy: [T('Devices')],
      anchor: 'devices',
    },
    disks: {
      hierarchy: [T('Disks')],
      anchor: 'disks',
    },
    nic: {
      hierarchy: [T('NIC')],
      anchor: 'nic',
    },
    proxies: {
      hierarchy: [T('Proxies')],
      anchor: 'proxies',
    },
    idmap: {
      hierarchy: [T('Idmap')],
      anchor: 'idmap',
    },
    tools: {
      hierarchy: [T('Tools')],
      anchor: 'tools',
    },
    metrics: {
      hierarchy: [T('Metrics')],
      anchor: 'metrics',
    },
  },
  visibleTokens: [GlobalSearchVisibleToken.Vms],
} satisfies UiSearchableElement;
