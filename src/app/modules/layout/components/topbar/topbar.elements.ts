import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const toolBarElements = {
  hierarchy: [T('Toolbar')],
  elements: {
    sendFeedback: {
      hierarchy: [T('Send Feedback')],
      synonyms: [
        T('Bug'),
        T('Feature Request'),
        T('Suggestion'),
        T('Improvement'),
        T('Review'),
        T('Report Bug'),
        T('Jira'),
        T('Ticket'),
        T('Issue'),
        T('Defect'),
        T('File Ticket'),
      ],
    },
    alerts: {
      hierarchy: [T('Alerts')],
      synonyms: [T('Notifications')],
    },
  },
} satisfies UiSearchableElement;
