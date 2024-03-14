import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  kernel: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Kernel'), T('Enable Kernel Debug')],
    synonyms: [],
    triggerAnchor: 'kernel-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
