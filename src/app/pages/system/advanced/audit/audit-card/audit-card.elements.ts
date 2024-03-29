import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const auditCardElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Audit')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-audit',
    },
  },
};
