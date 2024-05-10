import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const isolatedGpusCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Isolated GPU Device(s)')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    isolatedGpus: {
      anchor: 'configure-isolated-gpus',
    },
    isolatedGpuPciIds: {
      hierarchy: [T('GPUs')],
    },
  },
} satisfies UiSearchableElement;
