import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const shellElements = {
  hierarchy: [T('System'), T('Shell')],
  anchorRouterLink: ['/system', 'shell'],
  elements: {
    shell: {},
  },
} satisfies UiSearchableElement;
