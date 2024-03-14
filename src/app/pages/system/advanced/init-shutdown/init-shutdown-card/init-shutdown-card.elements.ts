import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';

export const elements: Record<string, UiSearchableElement> = {
  addInitShutdownScript: {
    hierarchy: [T('System Settings'), T('Advanced'), T('Init/Shutdown Scripts'), T('Add')],
    synonyms: [T('Add Init/Shutdown Script')],
    triggerAnchor: 'add-init-shutdown-script',
    anchorRouterLink: ['/system', 'advanced'],
  },
};
