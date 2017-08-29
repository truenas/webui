import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';

import { EntityModule } from '../../common/entity/entity.module';

import { ISCSI } from './iscsi.component';
import { routing } from './iscsi.routing';
import { GlobalconfigurationComponent } from './globalconfiguration/';
import { PortalListComponent } from './portal/portal-list/';
import { PortalAddComponent } from './portal/portal-add/';
import { PortalEditComponent } from './portal/portal-edit/';
import { InitiatorListComponent } from './initiator/initiator-list/';
import { InitiatorFormComponent } from './initiator/initiator-form/';
import { AuthorizedAccessListComponent } from './authorizedaccess/authorizedaccess-list/';
// import { AuthorizedAccessDeleteComponent } from './authorizedaccess/authorizedaccess-delete/';
// import { AuthorizedAccessFormComponent } from './authorizedaccess/authorizedaccess-form/';
// import { InitiatorDeleteComponent } from './initiator/initiator-delete/';
// import { PortalDeleteComponent } from './portal/portal-delete/';
// import { TargetAddComponent } from './target/target-add/';
// import { TargetEditComponent} from './target/target-edit/';
// import { TargetDeleteComponent} from './target/target-delete/';
// import { TargetListComponent} from './target/target-list/';
// import { ExtentListComponent } from './extent/extent-list/';
// import { ExtentDeleteComponent } from './extent/extent-delete/';
// import { ExtentFormComponent } from './extent/extent-form/';
// import { AssociatedTargetListComponent } from './associated-target/associated-target-list/';
// import { AssociatedTargetDeleteComponent } from './associated-target/associated-target-delete/';
// import { AssociatedTargetFormComponent } from './associated-target/associated-target-form/';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule
  ],
  declarations : [
    ISCSI,
    GlobalconfigurationComponent,
    PortalListComponent,
    // PortalDeleteComponent,
    PortalAddComponent,
    PortalEditComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    // InitiatorDeleteComponent,
    AuthorizedAccessListComponent,
    // AuthorizedAccessFormComponent,
    // AuthorizedAccessDeleteComponent,
    // TargetListComponent,
    // TargetEditComponent,
    // TargetDeleteComponent,
    // TargetAddComponent,
    // ExtentListComponent,
    // ExtentDeleteComponent,
    // ExtentFormComponent,
    // AssociatedTargetListComponent,
    // AssociatedTargetDeleteComponent,
    // AssociatedTargetFormComponent,
  ],
  providers : []
})
export class ISCSIModule {
}
