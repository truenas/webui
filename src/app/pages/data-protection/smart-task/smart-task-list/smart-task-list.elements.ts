import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const smartTaskListElements = {
  hierarchy: [T('Data Protection'), T('Periodic S.M.A.R.T. Tests')],
  anchorRouterLink: ['/data-protection', 'smart'],
  elements: {
    tasks: {
      synonyms: [T('Data Protection'), T('Tasks'), T('Smart'), T('S.M.A.R.T.')],
    },
    add: {
      hierarchy: [T('Add')],
      synonyms: [T('Add Periodic S.M.A.R.T. Test'), T('Add Smart Test')],
    },
  },
} satisfies UiSearchableElement;
