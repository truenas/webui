import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const sedFormElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Self-Encrypting Drive')],
  triggerAnchor: 'configure-sed',
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    sedUser: {
      hierarchy: [T('ATA Security User')],
      synonyms: [T('SED User')],
    },
    sedPassword: {
      hierarchy: [T('SED Password')],
    },
  },
};
