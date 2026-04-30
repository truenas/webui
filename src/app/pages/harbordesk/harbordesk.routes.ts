import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { HarborDeskComponent } from 'app/pages/harbordesk/harbordesk.component';

export const harbordeskRoutes: Routes = [
  {
    path: '',
    component: HarborDeskComponent,
    data: { title: T('HarborDesk'), breadcrumb: T('HarborDesk') },
  },
];
