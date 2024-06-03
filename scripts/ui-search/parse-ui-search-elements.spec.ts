import * as fs from 'fs';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { parseUiSearchElements } from './parse-ui-search-elements';

jest.mock('fs');

describe('Create UI Searchable Element Item', () => {
  it('correctly merges parent and child configurations and extracts non static html elements', () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(`
      <div
        [ixUiSearch]="elements.add"
        [routerLink]="['/groups', 'add']"
        *ixRequiresRoles="[Role.SystemAuditWrite]"
      ></div>
    `);

    const elementConfig = {
      groupsElements: {
        hierarchy: ['Credentials', 'Groups'],
        anchorRouterLink: ['/credentials', 'groups'],
        elements: {
          add: {
            hierarchy: ['Add'],
            synonyms: ['New Group'],
            anchor: 'add-group',
          },
        },
        manualRenderElements: {
          nonStaticElement: {
            hierarchy: ['Non-Static'],
            synonyms: ['Manual Element'],
          },
        },
      },
    } as Record<string, UiSearchableElement>;

    const parsedElements = parseUiSearchElements('mock-file.html', elementConfig, {});

    expect(parsedElements).toEqual([
      {
        hierarchy: ['Credentials', 'Groups', 'Non-Static'],
        synonyms: ['Manual Element'],
        requiredRoles: [],
        anchorRouterLink: ['/credentials', 'groups'],
        routerLink: null,
        anchor: 'non-static',
        triggerAnchor: null,
        section: 'ui',
      },
      {
        hierarchy: ['Credentials', 'Groups', 'Add'],
        synonyms: ['New Group'],
        requiredRoles: ['SYSTEM_AUDIT_WRITE'],
        anchorRouterLink: ['/credentials', 'groups'],
        routerLink: ['/groups', 'add'],
        anchor: 'add-group',
        triggerAnchor: null,
        section: 'ui',
      },
    ]);
  });
});
