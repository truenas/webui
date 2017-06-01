import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ISCSI } from './iscsi.component';
import { GlobalconfigurationComponent } from './globalconfiguration/';
import { PortalListComponent } from './portal/portal-list/';
import { PortalDeleteComponent } from './portal/portal-delete/';
import { PortalAddComponent } from './portal/portal-add/';
import { PortalEditComponent } from './portal/portal-edit/';
import { InitiatorAddComponent } from './initiator/initiator-add/';

export const routes: Routes = [
	{ path: '', component: ISCSI},
	{ path: 'portals/delete/:pk', component: PortalDeleteComponent},
	{ path: 'portals/add', component: PortalAddComponent},
	{ path: 'portals/edit/:pk', component: PortalEditComponent},
	{ path: 'initiators/add', component: InitiatorAddComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
