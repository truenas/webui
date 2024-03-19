import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  // TODO: Use it when added support to handle multiple items using same triggerAnchor
  configureAccess: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Access'), T('Configure')],
    synonyms: [T('Configure Sessions')],
    triggerAnchor: 'access-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
  terminateOtherSessions: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Access'), T('Terminate Other Sessions')],
    synonyms: [T('Terminate Other User Sessions')],
    triggerAnchor: 'terminate-other-sessions',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
