import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '@angular/material';

import { EntityModule } from '../../common/entity/entity.module';
import { routing } from './iscsi.routing';

import { ISCSI } from './iscsi.component';
import { GlobalconfigurationComponent } from './globalconfiguration/';
import { PortalListComponent } from './portal/portal-list/';
import { PortalAddComponent } from './portal/portal-add/';
import { PortalEditComponent } from './portal/portal-edit/';
import { InitiatorListComponent } from './initiator/initiator-list/';
import { InitiatorFormComponent } from './initiator/initiator-form/';
import { AuthorizedAccessListComponent } from './authorizedaccess/authorizedaccess-list/';
import { AuthorizedAccessFormComponent } from './authorizedaccess/authorizedaccess-form/';
import { TargetListComponent} from './target/target-list/';
import { TargetAddComponent } from './target/target-add/';
import { TargetEditComponent} from './target/target-edit/';
import { ExtentListComponent } from './extent/extent-list/';
import { ExtentFormComponent } from './extent/extent-form/';
import { AssociatedTargetListComponent } from './associated-target/associated-target-list/';
import { AssociatedTargetFormComponent } from './associated-target/associated-target-form/';

@NgModule({
  imports : [
    EntityModule, CommonModule, FormsModule,
    ReactiveFormsModule, routing, MaterialModule
  ],
  declarations : [
    ISCSI,
    GlobalconfigurationComponent,
    PortalListComponent,
    PortalAddComponent,
    PortalEditComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    AuthorizedAccessListComponent,
    AuthorizedAccessFormComponent,
    TargetListComponent,
    TargetAddComponent,
    TargetEditComponent,
    ExtentListComponent,
    ExtentFormComponent,
    AssociatedTargetListComponent,
    AssociatedTargetFormComponent,
  ],
  providers : []
})
export class ISCSIModule {
}
