import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  reporting: {
    hierarchy: [T('Reporting')],
    synonyms: [T('Stats')],
    anchor: null,
    anchorRouterLink: ['/reportsdashboard'],
  },
};
