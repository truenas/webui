import * as fs from 'fs';
import { Role } from 'app/enums/role.enum';
import { extractComponentFileContent } from './extract-component-file-content';
import { extractUiSearchableElements } from './extract-ui-searchable-elements';
import { findComponentFiles } from './find-component-files';
import { parseHtmlFile } from './parse-html-file';

jest.mock('fs');
jest.mock('path');
jest.mock('./extract-component-file-content', () => ({ extractComponentFileContent: jest.fn() }));
jest.mock('./find-component-files', () => ({ findComponentFiles: jest.fn() }));
jest.mock('./parse-html-file', () => ({ parseHtmlFile: jest.fn() }));

const mockUiElements = [
  {
    hierarchy: [
      'System',
      'Advanced',
      'Audit',
      'Reservation',
    ],
    synonyms: [
      'Audit',
    ],
    requiredRoles: [
      'SYSTEM_AUDIT_WRITE',
    ],
    anchorRouterLink: [
      '/system',
      'advanced',
    ],
    anchor: 'reservation',
    triggerAnchor: 'configure-audit',
    section: 'ui',
  },
  {
    hierarchy: [
      'Credentials',
      'Groups',
      'Add',
    ],
    synonyms: [
      'Groups',
    ],
    requiredRoles: [
      'ACCOUNT_WRITE',
    ],
    anchorRouterLink: [
      '/credentials',
      'groups',
    ],
    anchor: 'add-group',
    triggerAnchor: null,
    section: 'ui',
  },
];

describe('extract [ixUiSearch] elements', () => {
  it('should extract UI searchable elements and write to a file', async () => {
    (findComponentFiles as jest.Mock).mockResolvedValue(['audit-form.elements.ts', 'group-list.elements.ts']);
    (extractComponentFileContent as jest.Mock).mockReturnValue({});
    (parseHtmlFile as jest.Mock)
      .mockReturnValueOnce([mockUiElements[0]])
      .mockReturnValueOnce([mockUiElements[1]]);
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

    await extractUiSearchableElements();

    expect(findComponentFiles).toHaveBeenCalledWith('src/**/*.elements.ts');
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'src/assets/ui-searchable-elements.json',
      JSON.stringify(mockUiElements, null, 2),
    );
  });
});

describe('Parsing and Role Extraction', () => {
  it('should correctly extract required roles for elements', async () => {
    (findComponentFiles as jest.Mock).mockResolvedValue(['ipmi.elements.ts']);
    (extractComponentFileContent as jest.Mock).mockReturnValue({
      requiredRoles: [Role.IpmiWrite],
    });
    (parseHtmlFile as jest.Mock).mockImplementation((_1, _2, componentProperties) => {
      return [{
        elements: {
          add: {
            requiredRoles: (componentProperties as { requiredRoles: Role [] }).requiredRoles,
          },
        },
      }];
    });

    await extractUiSearchableElements();

    const expectedOutput = JSON.stringify([
      ...mockUiElements,
      {
        elements: {
          add: {
            requiredRoles: ['IPMI_WRITE'],
          },
        },
      },
    ], null, 2);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'src/assets/ui-searchable-elements.json',
      expectedOutput,
    );
  });
});
