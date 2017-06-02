import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ISCSI } from './iscsi.component';
import { GlobalconfigurationComponent } from './globalconfiguration/';
import { PortalListComponent } from './portal/portal-list/';
import { PortalDeleteComponent } from './portal/portal-delete/';
import { PortalAddComponent } from './portal/portal-add/';
import { PortalEditComponent } from './portal/portal-edit/';
import { InitiatorAddComponent } from './initiator/initiator-add/';
import { InitiatorDeleteComponent } from './initiator/initiator-delete/';
import { InitiatorEditComponent } from './initiator/initiator-edit/';
import { AuthorizedAccessAddComponent } from './authorizedaccess/authorizedaccess-add/';
import { AuthorizedAccessDeleteComponent } from './authorizedaccess/authorizedaccess-delete/';
import { AuthorizedAccessEditComponent } from './authorizedaccess/authorizedaccess-edit/';

export const routes: Routes = [
	{ path: '', component: ISCSI},
	{ path: 'portals/delete/:pk', component: PortalDeleteComponent},
	{ path: 'portals/add', component: PortalAddComponent},
	{ path: 'portals/edit/:pk', component: PortalEditComponent},
	{ path: 'initiators/add', component: InitiatorAddComponent},
	{ path: 'initiators/delete/:pk', component: InitiatorDeleteComponent},
	{ path: 'initiators/edit/:pk', component: InitiatorEditComponent},
	{ path: 'auth/add', component:AuthorizedAccessAddComponent},
	{ path: 'auth/delete/:pk', component: AuthorizedAccessDeleteComponent},
	{ path: 'auth/edit/:pk', component: AuthorizedAccessEditComponent},
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
