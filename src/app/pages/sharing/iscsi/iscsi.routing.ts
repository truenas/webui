import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ISCSI } from './iscsi.component';
import { GlobalconfigurationComponent } from './globalconfiguration/';
import { PortalListComponent } from './portal/portal-list/';
import { PortalDeleteComponent } from './portal/portal-delete/';

export const routes: Routes = [
	{ path: '', component: ISCSI},
	{ path: 'portals/delete/:pk', component: PortalDeleteComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
