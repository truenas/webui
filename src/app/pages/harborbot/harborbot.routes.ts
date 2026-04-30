import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { HarborBotComponent } from 'app/pages/harborbot/harborbot.component';

export const harborbotRoutes: Routes = [
  {
    path: '',
    component: HarborBotComponent,
    data: { title: T('HarborBot'), breadcrumb: T('HarborBot') },
  },
];
