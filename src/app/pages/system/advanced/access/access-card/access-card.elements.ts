import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const accessCardElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Access')],
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
};
