import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const activeDirectoryElements = {
  hierarchy: [T('Directory Services'), T('Active Directory')],
  anchorRouterLink: ['/directoryservice', 'activedirectory'],
  elements: {
    activeDirectory: {},
  },
} satisfies UiSearchableElement;
