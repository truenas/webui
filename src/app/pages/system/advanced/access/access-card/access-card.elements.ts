import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const accessCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Access')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configureAccess: {
      hierarchy: [T('Configure')],
      synonyms: [T('Configure Sessions')],
      anchor: 'configure-access',
    },
    terminateOtherSessions: {
      hierarchy: [T('Terminate Other Sessions')],
      synonyms: [T('Terminate Other User Sessions')],
    },
  },
} satisfies UiSearchableElement;
