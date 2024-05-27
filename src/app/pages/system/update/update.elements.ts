import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const systemUpdateElements = {
  hierarchy: [T('System'), T('Update')],
  anchorRouterLink: ['/system', 'update'],
  elements: {
    update: {
      hierarchy: [T('Check for Updates')],
      synonyms: [
        T('Update'),
        T('Upgrade'),
        T('Update System'),
        T('Update Software'),
        T('Check for Updates'),
        T('Check for Software Updates'),
        T('Download Updates'),
      ],
    },
    releaseNotes: {
      hierarchy: [T('Release Notes')],
      synonyms: [
        T('Check Release Notes'),
        T('Release Notes'),
        T('View Release Notes'),
        T('View Changelog'),
        T('Changelog'),
        T('Upgrade Release Notes'),
        T('Update Release Notes'),
      ],
    },
  },
} satisfies UiSearchableElement;
