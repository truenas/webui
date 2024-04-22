import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const isolatedGpusCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Isolated GPU Device(s)')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-isolated-gpus',
    },
  },
} satisfies UiSearchableElement;
