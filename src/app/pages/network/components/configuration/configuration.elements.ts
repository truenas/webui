import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const networkConfigurationFormElements = {
  hierarchy: [T('Network'), T('Global Configuration')],
  anchorRouterLink: ['/network'],
  triggerAnchor: 'configure-global-network-configuration',
  elements: {
    defaultGateway: {
      triggerAnchor: 'configure-global-network-configuration',
      hierarchy: [T('Default Gateway')],
      synonyms: [T('Gateway')],
    },
  },
} satisfies UiSearchableElement;
