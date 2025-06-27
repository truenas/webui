import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const userAccessCardElements = {
  hierarchy: [T('Credentials'), T('Users (WIP)')],
  anchorRouterLink: ['/credentials/users-new'],
  elements: {
    viewApiKeys: { hierarchy: [T('View API Keys')] },
    addApiKey: { hierarchy: [T('Add API Key')] },
    downloadKey: { hierarchy: [T('Download Key')] },
    toggleLock: {
      hierarchy: [T('Toggle Lock Status')],
      synonyms: [T('Lock User'), T('Unlock User')],
    },
  },
} satisfies UiSearchableElement;
