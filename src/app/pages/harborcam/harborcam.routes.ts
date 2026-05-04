import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { HarborAssistantRedirectComponent } from 'app/pages/harbor-assistant/harbor-assistant-redirect.component';

export const harborcamRoutes: Routes = [
  {
    path: '',
    component: HarborAssistantRedirectComponent,
    data: { title: T('Harbor Assistant'), breadcrumb: T('Harbor Assistant'), assistantTab: 'camera' },
  },
];
