import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { WebShareListComponent } from './webshare-list/webshare-list.component';

export const webShareRoutes: Routes = [
  {
    path: '',
    component: WebShareListComponent,
    data: { title: T('WebShares'), breadcrumb: T('WebShares') },
  },
];
