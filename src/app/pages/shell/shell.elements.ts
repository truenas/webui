import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const shellElements = {
  hierarchy: [T('System'), T('Shell')],
  anchorRouterLink: ['/system', 'shell'],
  synonyms: [T('CLI'), T('Terminal'), T('Console'), T('Command Line Interface'), T('Prompt')],
  elements: {
    shell: {
      anchor: 'shell',
    },
  },
} satisfies UiSearchableElement;
