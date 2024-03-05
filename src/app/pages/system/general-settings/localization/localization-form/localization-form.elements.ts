import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Role } from 'app/enums/role.enum';
import { UiSearchElements } from 'app/interfaces/ui-searchable-element.interface';

export const elements: UiSearchElements = {
  language: {
    hierarchy: [T('System Settings'), T('General'), T('Localization'), T('Language')],
    synonyms: [T('Translate App')],
    triggerAnchor: 'localization-settings',
    anchor: 'language-input',
    anchorRouterLink: ['/system', 'general'],
    requiredRoles: [Role.FullAdmin],
  },
};
