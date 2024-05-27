import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const alertServiceListElements = {
  hierarchy: [T('System'), T('Alert Settings'), T('Alert Services')],
  anchorRouterLink: ['/system', 'alert-settings', 'services'],
  synonyms: [T('Alerts'), T('Configure Notifications'), T('Configure Alerts')],
  elements: {
    alertServiceList: {},
    add: {
      hierarchy: [T('Add')],
      synonyms: [
        T('Alerts'),
        T('Configure Alerts'),
        T('Create Alert'),
        T('Add Alert'),
        T('New Alert'),
        T('Notifications'),
      ],
    },
  },
} satisfies UiSearchableElement;
