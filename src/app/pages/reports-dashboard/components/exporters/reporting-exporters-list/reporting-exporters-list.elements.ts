import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const reportingExportersElements = {
  hierarchy: [T('Reporting'), T('Reporting Exporters')],
  anchorRouterLink: ['/reportsdashboard', 'exporters'],
  elements: {
    exporters: {},
  },
} satisfies UiSearchableElement;
