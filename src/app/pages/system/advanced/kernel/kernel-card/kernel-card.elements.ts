import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const kernelCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Kernel')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    kernel: {
      anchor: 'kernel-card',
    },
    enableKernelDebug: {
      hierarchy: [T('Enable Kernel Debug')],
    },
  },
} satisfies UiSearchableElement;
