import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const isolatedGpusCardElements = {
  hierarchy: [T('System Settings'), T('Advanced'), T('Isolated GPU Device(s)')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    configure: {
      hierarchy: [T('Configure')],
      anchor: 'configure-isolated-gpus',
    },
  },
};
