import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ISCSI } from './iscsi.component';
import { PortalAddComponent } from './portal/portal-add/';
import { PortalEditComponent } from './portal/portal-edit/';
import { InitiatorFormComponent } from './initiator/initiator-form/';
import { AuthorizedAccessFormComponent } from './authorizedaccess/authorizedaccess-form/';
import { TargetAddComponent } from './target/target-add/';
import { TargetEditComponent } from './target/target-edit/';
import { ExtentFormComponent } from './extent/extent-form/';
import { AssociatedTargetFormComponent } from './associated-target/associated-target-form/';

export const routes: Routes = [
  { path : '', component: ISCSI },
  { path : ':pk', component : ISCSI },
  { path : 'portals/add', component : PortalAddComponent },
  { path : 'portals/edit/:pk', component : PortalEditComponent },
  { path : 'initiators/add', component : InitiatorFormComponent },
  { path : 'initiators/edit/:pk', component : InitiatorFormComponent },
  { path : 'auth/add', component : AuthorizedAccessFormComponent },
  { path : 'auth/edit/:pk', component : AuthorizedAccessFormComponent },
  { path : 'target/add', component : TargetAddComponent },
  { path : 'target/edit/:pk', component: TargetEditComponent },
  { path : 'extent/add', component: ExtentFormComponent },
  { path : 'extent/edit/:pk', component: ExtentFormComponent },
  { path : 'associatedtarget/add', component: AssociatedTargetFormComponent },
  { path : 'associatedtarget/edit/:pk', component: AssociatedTargetFormComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
