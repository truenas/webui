import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import {
  JbofListComponent,
} from 'app/pages/system/enclosure/components/jbof-list/jbof-list.component';
import { ElementsPageComponent } from 'app/pages/system/enclosure/components/pages/elements-page/elements-page.component';
import {
  EnclosurePageComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-page.component';

const routes: Routes = [
  // Has to be above other items.
  {
    path: 'jbof',
    component: JbofListComponent,
    data: { title: T('NVMe-oF Expansion Shelves'), breadcrumb: null },
  },
  {
    path: '',
    component: EnclosureDashboardComponent,
    data: { title: T('View Enclosure'), breadcrumb: null },
    children: [
      {
        path: '',
        component: EnclosurePageComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
      {
        path: ':enclosure',
        component: EnclosurePageComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
      {
        path: ':enclosure/:view',
        component: ElementsPageComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
