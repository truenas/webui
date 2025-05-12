import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const storageHealthCardElements = {
  hierarchy: [T('Storage')],
  anchorRouterLink: ['/storage'],
  elements: {
    zfsHealth: {
      hierarchy: [T('Storage Health')],
    },
    scrubNow: {
      hierarchy: [T('Scrub Now')],
      synonyms: [T('Run Scrub'), T('Start Scrub')],
    },
    scheduledScrub: {
      hierarchy: [T('Scheduled Scrub')],
      synonyms: [
        T('Periodic Scrub'),
        T('Scrub Task'),
        T('Periodic Disk Checks'),
        T('Scrub Schedule'),
        T('Scrub Interval'),
      ],
    },
    autoTrim: {
      hierarchy: [T('Auto TRIM')],
      synonyms: [T('Edit Trim'), T('Edit Auto TRIM')],
    },
  },
} satisfies UiSearchableElement;
