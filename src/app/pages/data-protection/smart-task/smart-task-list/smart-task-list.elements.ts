import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const smartTaskListElements = {
  hierarchy: [T('Data Protection'), T('Periodic S.M.A.R.T. Tests')],
  anchorRouterLink: ['/data-protection', 'smart'],
  elements: {
    tasks: {
      anchor: 'smart-tasks',
      synonyms: [
        T('Data Protection'),
        T('Tasks'),
        T('Smart'),
        T('S.M.A.R.T.'),
        T('Smart Tests'),
        T('Disk Tests'),
      ],
    },
    add: {
      hierarchy: [T('Add S.M.A.R.T. Test')],
      anchor: 'add-smart-test',
      synonyms: [
        T('Add Periodic S.M.A.R.T. Test'),
        T('Add Smart Test'),
        T('Create Periodic S.M.A.R.T. Test'),
        T('Create Smart Test'),
        T('New Periodic S.M.A.R.T. Test'),
        T('New Smart Test'),
        T('Test'),
        T('Smart'),
        T('Add Disk Test'),
        T('New Disk Test'),
        T('Create Disk Test'),
      ],
    },
  },
} satisfies UiSearchableElement;
