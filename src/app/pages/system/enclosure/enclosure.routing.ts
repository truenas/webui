import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import {
  JbofListComponent,
} from 'app/pages/system/enclosure/components/jbof-list/jbof-list.component';
import {
  EnclosureViewComponent,
} from 'app/pages/system/enclosure/components/views/enclosure-view/enclosure-view.component';
import { ElementsComponent } from './components/views/elements-view/elements.component';

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
        component: EnclosureViewComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
      {
        path: ':enclosure',
        component: EnclosureViewComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
      {
        path: ':enclosure/:view',
        component: ElementsComponent,
        data: { title: T('View Enclosure'), breadcrumb: null },
      },
    ],
  },
];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
