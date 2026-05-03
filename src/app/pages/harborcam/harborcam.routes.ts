import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { HarborCamComponent } from 'app/pages/harborcam/harborcam.component';

export const harborcamRoutes: Routes = [
  {
    path: '',
    component: HarborCamComponent,
    data: { title: T('HarborCam'), breadcrumb: T('HarborCam') },
  },
];
