import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const alertServiceListElements = {
  hierarchy: [T('System'), T('Alert Settings'), T('Alert Services')],
  anchorRouterLink: ['/system', 'alert-settings', 'services'],
  synonyms: [T('Alerts'), T('Configure Notifications'), T('Configure Alerts')],
  elements: {
    alertServiceList: {
      anchor: 'alert-service-list',
    },
    add: {
      hierarchy: [T('Add Alert')],
      anchor: 'add-alert-service',
      synonyms: [
        T('Alerts'),
        T('Configure Alerts'),
        T('Create Alert'),
        T('New Alert'),
        T('Notifications'),
      ],
    },
  },
} satisfies UiSearchableElement;
