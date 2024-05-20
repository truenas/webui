import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const cronCardElements = {
  hierarchy: [T('System'), T('Advanced'), T('Cron Jobs')],
  synonyms: [T('Add Cron Job')],
  anchorRouterLink: ['/system', 'advanced'],
  elements: {
    addCronJob: {
      hierarchy: [T('Add')],
      synonyms: [
        T('Add Cron Job'),
        T('Create Cron Job'),
        T('New Cron Job'),
        T('Setup Cron Job'),
        T('Cron Job'),
        T('Cronjob'),
      ],
    },
  },
} satisfies UiSearchableElement;
