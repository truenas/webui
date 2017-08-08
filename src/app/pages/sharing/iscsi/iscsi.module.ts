import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {DynamicFormsCoreModule} from '@ng2-dynamic-forms/core';
import {DynamicFormsBootstrapUIModule} from '@ng2-dynamic-forms/ui-bootstrap';
import {MaterialModule} from '@angular/material';

import {NgaModule} from '../../../theme/nga.module';
import {EntityModule} from '../../common/entity/entity.module';
import {AuthorizedAccessAddComponent} from './authorizedaccess/authorizedaccess-add';
import {AuthorizedAccessDeleteComponent} from './authorizedaccess/authorizedaccess-delete/';
import {AuthorizedAccessEditComponent} from './authorizedaccess/authorizedaccess-edit';
import {AuthorizedAccessFormComponent} from './authorizedaccess/authorizedaccess-form/';
import {AuthorizedAccessListComponent} from './authorizedaccess/authorizedaccess-list/';
import {GlobalconfigurationComponent} from './globalconfiguration/';
import {InitiatorAddComponent} from './initiator/initiator-add';
import {InitiatorDeleteComponent} from './initiator/initiator-delete/';
import {InitiatorEditComponent} from './initiator/initiator-edit';
import {InitiatorFormComponent} from './initiator/initiator-form/';
import {InitiatorListComponent} from './initiator/initiator-list/';
import {ISCSI} from './iscsi.component';
import {routing} from './iscsi.routing';
import {PortalAddComponent} from './portal/portal-add/';
import {PortalDeleteComponent} from './portal/portal-delete/';
import {PortalEditComponent} from './portal/portal-edit/';
import {PortalListComponent} from './portal/portal-list/';
import {TargetAddComponent} from './target/target-add/';
import {TargetEditComponent} from './target/target-edit/';
import {TargetDeleteComponent} from './target/target-delete/';
import {TargetListComponent} from './target/target-list/';
import { ExtentListComponent } from './extent/extent-list/';
import { ExtentDeleteComponent } from './extent/extent-delete/';
import { ExtentFormComponent } from './extent/extent-form/';

@NgModule({
  imports : [
    EntityModule, DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule, CommonModule, FormsModule,
    ReactiveFormsModule, NgaModule, routing, MaterialModule
  ],
  declarations : [
    ISCSI,
    GlobalconfigurationComponent,
    PortalListComponent,
    PortalDeleteComponent,
    PortalAddComponent,
    PortalEditComponent,
    InitiatorAddComponent,
    InitiatorEditComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    InitiatorDeleteComponent,
    AuthorizedAccessAddComponent,
    AuthorizedAccessEditComponent,
    AuthorizedAccessListComponent,
    AuthorizedAccessFormComponent,
    AuthorizedAccessDeleteComponent,
    TargetListComponent,
    TargetEditComponent,
    TargetDeleteComponent,
    TargetAddComponent,
    ExtentListComponent,
    ExtentDeleteComponent,
    ExtentFormComponent,
  ],
  providers : []
})
export class ISCSIModule {
}
