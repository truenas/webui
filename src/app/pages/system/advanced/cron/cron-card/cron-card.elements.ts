import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  addCronJob: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Cron Jobs'), T('Add')],
    synonyms: [T('Add Cron Job')],
    triggerAnchor: 'add-cron',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
