import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cronCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Cron Jobs'), T('Add')],
  synonyms: [T('Add Cron Job')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    addCronJob: {},
  },
} satisfies UiSearchableElement;
