import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const allInstancesHeaderElements = {
  hierarchy: [T('Containers')],
  anchorRouterLink: ['/instances'],
  elements: {
    globalSettings: {
      hierarchy: [T('Global Settings')],
      synonyms: [T('Container Settings')],
      anchor: 'vm-global-settings',
    },
    add: {
      hierarchy: [T('Create New Container')],
      synonyms: [T('New Container'), T('Add Container')],
      anchor: 'add-instance',
    },
  },
} satisfies UiSearchableElement;
