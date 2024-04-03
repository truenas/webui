import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const localizationCardElements = {
  hierarchy: [T('System'), T('General'), T('Localization')],
  anchorRouterLink: ['/system', 'general'],
  elements: {
    configure: {
      hierarchy: [T('Settings')],
      anchor: 'configure-localization',
    },
  },
};
