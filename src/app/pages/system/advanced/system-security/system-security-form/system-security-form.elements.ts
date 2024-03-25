import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const systemSecurityFormElements = {
  enableFips: {
    hierarchy: [T('System Settings'), T('Advanced'), T('System Security'), T('Enable FIPS')],
    triggerAnchor: 'system-security-settings',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
