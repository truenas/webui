import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const reportingExportersElements = {
  hierarchy: [T('Reporting'), T('Reporting Exporters')],
  anchorRouterLink: ['/reportsdashboard', 'exporters'],
  elements: {
    exporters: {
      anchor: 'exporters',
    },
    add: {
      hierarchy: [T('Add Reporting Exporter')],
      anchor: 'add-reporting-exporter',
      synonyms: [
        T('Add Exporter'),
        T('New Exporter'),
        T('Create Exporter'),
        T('Exporter'),
        T('New Reporting Exporter'),
        T('Create Reporting Exporter'),
      ],
    },
  },
} satisfies UiSearchableElement;
