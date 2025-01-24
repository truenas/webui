import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const dockerRegistriesListElements = {
  hierarchy: [T('Applications'), T('Docker Registries')],
  anchorRouterLink: ['/apps', 'docker-registries'],
  elements: {
    dockerRegistriesList: {
      anchor: 'docker-registries-list',
    },
    addRegistry: {
      hierarchy: [T('Add Registry')],
      synonyms: [T('Add Docker Registry')],
    },
  },
} satisfies UiSearchableElement;
