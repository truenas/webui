import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const guiCardElements = {
  hierarchy: [T('System Settings'), T('General'), T('GUI')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    configure: {
      hierarchy: [T('Settings')],
      anchor: 'configure-gui',
    },
  },
};
