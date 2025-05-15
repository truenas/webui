import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const subsystemListElements = {
  hierarchy: [T('Shares'), T('Nvme-Of'), T('Subsystems')],
  synonyms: [('FC')],
  anchorRouterLink: ['/sharing', 'nvme-of', 'subsystems'],
  elements: {
    list: {
      anchor: 'subsystems-list',
    },
    add: {
      hierarchy: [T('Add Subsystem')],
      synonyms: [T('New Subsystem'), T('Create Subsystem')],
      anchor: 'add-subsystem',
    },
  },
} satisfies UiSearchableElement;
