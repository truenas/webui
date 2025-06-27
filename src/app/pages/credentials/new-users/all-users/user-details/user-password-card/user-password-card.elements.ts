import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userPasswordCardElements = {
  hierarchy: [T('Credentials'), T('Users (WIP)')],
  anchorRouterLink: ['/credentials/users-new'],
  elements: {
    generateOtp: { hierarchy: [T('Generate One-Time Password')] },
  },
} satisfies UiSearchableElement;
