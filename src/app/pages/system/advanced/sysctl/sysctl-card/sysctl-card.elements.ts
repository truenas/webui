import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const sysctlCardElements = {
  addSysctl: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Sysctl'), T('Add')],
    synonyms: [T('Add Tunable'), T('Add Sysctl')],
    triggerAnchor: 'add-sysctl',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
