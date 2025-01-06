import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const systemManualUpdateFormElements = {
  hierarchy: [T('System'), T('Update'), T('Manual Update')],
  anchorRouterLink: ['/system', 'update', 'manualupdate'],
  synonyms: [T('Install Manual Update File'), T('Manual Update'), T('Manual Upgrade'), T('Upload Manual Update File')],
  elements: {
    manualUpdate: {
      anchor: 'manual-update',
    },
  },
} satisfies UiSearchableElement;
