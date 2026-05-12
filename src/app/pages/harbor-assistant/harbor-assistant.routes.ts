import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { HarborAssistantComponent } from 'app/pages/harbor-assistant/harbor-assistant.component';

export const harborAssistantRoutes: Routes = [
  {
    path: '',
    component: HarborAssistantComponent,
    data: { title: T('Harbor Assistant'), breadcrumb: T('Harbor Assistant') },
  },
];
