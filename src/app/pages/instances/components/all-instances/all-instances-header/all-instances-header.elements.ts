import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allInstancesHeaderElements = {
  hierarchy: [T('Instances')],
  synonyms: [T('VMs'), T('Virtual Machines'), T('Virtualization'), T('Containers')],
  anchorRouterLink: ['/instances'],
  elements: {
    globalSettings: {
      hierarchy: [T('Global Settings')],
      synonyms: [T('VM Settings'), T('Virtual Machine Settings')],
      anchor: 'vm-global-settings',
    },
    add: {
      hierarchy: [T('Create New Instance')],
      synonyms: [T('Add Instance'), T('Create VM'), T('Add VM'), T('New VM'), T('New Container'), T('Add Container')],
      anchor: 'add-instance',
    },
  },
} satisfies UiSearchableElement;
