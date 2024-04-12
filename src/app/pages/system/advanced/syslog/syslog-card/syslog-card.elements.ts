import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const syslogCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Syslog')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-syslog',
    },
  },
};
