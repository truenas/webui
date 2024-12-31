import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const auditElements = {
  hierarchy: [T('System'), T('Audit')],
  anchorRouterLink: ['/system', 'audit'],
  elements: {
    audit: {
      anchor: 'audit-list',
      synonyms: [T('Logs')],
    },
  },
} satisfies UiSearchableElement;
