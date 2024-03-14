import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  isolatedGpuPciIds: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Isolated GPU Devices'), T('GPUs')],
    synonyms: [T('Isolated GPU PCI Ids')],
    triggerAnchor: 'isolated-gpus-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
