import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const sedCardElements = {
  hierarchy: [T('System'), T('Advanced Settings'), T('Self-Encrypting Drive')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    selfEncryptingDrive: {
      anchor: 'sed-card',
    },
    configure: {
      anchor: 'sed-settings',
      hierarchy: [T('Configure Self-Encrypting Drive')],
      synonyms: [T('Self-Encrypting Drive Settings')],
    },
    sedUser: {
      hierarchy: [T('ATA Security User')],
      synonyms: [T('SED User')],
    },
    sedPassword: {
      hierarchy: [T('SED Password')],
    },
  },
} satisfies UiSearchableElement;
