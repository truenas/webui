import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kernelCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Kernel')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    kernel: {
      anchor: 'kernel-card',
    },
    configure: {
      anchor: 'kernel-settings',
      hierarchy: [T('Configure Kernel')],
      synonyms: [T('Kernel Settings')],
    },
    enableKernelDebug: {
      hierarchy: [T('Enable Kernel Debug')],
    },
  },
} satisfies UiSearchableElement;
