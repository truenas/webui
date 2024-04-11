import * as fs from 'fs';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { parseHtmlFile } from './parse-html-file';

jest.mock('fs');

describe('Data Merging in parseHtmlFile', () => {
  it('correctly merges parent and child configurations', () => {
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
            anchor: 'add-group',
          },
        },
      },
    } as UiSearchableElement;

    const parsedElements = parseHtmlFile('mock-file.html', elementConfig, {});

    expect(parsedElements).toContainEqual(expect.objectContaining({
      anchor: 'add-group',
      anchorRouterLink: ['/credentials', 'groups'],
      hierarchy: ['Credentials', 'Groups', 'Add'],
      requiredRoles: ['SYSTEM_AUDIT_WRITE'],
      routerLink: ['/groups', 'add'],
      section: 'ui',
      synonyms: ['Groups'],
      triggerAnchor: null,
    } as UiSearchableElement));
  });
});
