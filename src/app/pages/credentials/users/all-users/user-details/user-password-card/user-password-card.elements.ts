import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userPasswordCardElements = {
  hierarchy: [T('Credentials'), T('Users')],
  anchorRouterLink: ['/credentials/users'],
  elements: {
    generateOtp: { hierarchy: [T('Generate One-Time Password')] },
  },
} satisfies UiSearchableElement;
