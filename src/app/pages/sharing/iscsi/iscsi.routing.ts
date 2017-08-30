import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// import { AuthorizedAccessDeleteComponent } from './authorizedaccess/authorizedaccess-delete/';

// import { InitiatorDeleteComponent } from './initiator/initiator-delete/';
import { ISCSI } from './iscsi.component';
import { PortalAddComponent } from './portal/portal-add/';
// import { PortalDeleteComponent } from './portal/portal-delete/';
import { PortalEditComponent } from './portal/portal-edit/';
import { InitiatorFormComponent } from './initiator/initiator-form/';
import { AuthorizedAccessFormComponent } from './authorizedaccess/authorizedaccess-form/';
import { TargetAddComponent } from './target/target-add/';
import { TargetEditComponent } from './target/target-edit/';
// import { TargetDeleteComponent } from './target/target-delete/';
// import { ExtentDeleteComponent } from './extent/extent-delete/';
import { ExtentFormComponent } from './extent/extent-form/';
// import { AssociatedTargetDeleteComponent } from './associated-target/associated-target-delete/';
// import { AssociatedTargetFormComponent } from './associated-target/associated-target-form/';

export const routes: Routes = [
  { path : '', component: ISCSI },
  { path : ':pk', component : ISCSI },
  // { path : 'portals/delete/:pk', component : PortalDeleteComponent },
  { path : 'portals/add', component : PortalAddComponent },
  { path : 'portals/edit/:pk', component : PortalEditComponent },
  { path : 'initiators/add', component : InitiatorFormComponent },
  // { path : 'initiators/delete/:pk', component : InitiatorDeleteComponent },
  { path : 'initiators/edit/:pk', component : InitiatorFormComponent },
  { path : 'auth/add', component : AuthorizedAccessFormComponent },
  // { path : 'auth/delete/:pk', component : AuthorizedAccessDeleteComponent },
  { path : 'auth/edit/:pk', component : AuthorizedAccessFormComponent },
  // { path : 'target/delete/:pk', component : TargetDeleteComponent },
  { path : 'target/add', component : TargetAddComponent },
  { path : 'target/edit/:pk', component: TargetEditComponent },
  // { path : 'extent/delete/:pk', component: ExtentDeleteComponent },
  { path : 'extent/add', component: ExtentFormComponent },
  { path : 'extent/edit/:pk', component: ExtentFormComponent },
  // { path : 'associatedtarget/delete/:pk', component: AssociatedTargetDeleteComponent },
  // { path : 'associatedtarget/add', component: AssociatedTargetFormComponent },
  // { path : 'associatedtarget/edit/:pk', component: AssociatedTargetFormComponent },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
