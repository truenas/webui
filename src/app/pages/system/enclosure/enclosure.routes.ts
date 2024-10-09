import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  JbofListComponent,
} from 'app/pages/system/enclosure/components/jbof-list/jbof-list.component';
import { ElementsPageComponent } from 'app/pages/system/enclosure/components/pages/elements-page/elements-page.component';
import {
  EnclosurePageComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-page.component';
import { MiniPageComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-page.component';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/enclosure-dashboard.component';

export const enclosureRoutes: Routes = [
  // Has to be above other items.
  {
    path: 'jbof',
    component: JbofListComponent,
    data: { title: T('NVMe-oF Expansion Shelves'), breadcrumb: null },
  },
  // The routes below are defined in this specific way below for a reason.
  // It avoids flashes when user navigates from /system/viewenclosure to /system/viewenclosure/
  // and it allows EnclosureDashboardComponent to have enclosure param available to it.
  {
    path: '',
    pathMatch: 'full',
    data: { title: T('View Enclosure'), breadcrumb: null },
    redirectTo: '/system/viewenclosure/',
  },
  {
    path: ':enclosure',
    component: EnclosureDashboardComponent,
    data: { title: T('View Enclosure'), breadcrumb: null },
    children: [
      {
        path: '',
        component: EnclosurePageComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
      {
        path: 'mini',
        component: MiniPageComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
      {
        path: ':view',
        component: ElementsPageComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
    ],
  },
];
