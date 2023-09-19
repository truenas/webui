import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { NgxDualListboxModule } from 'app/modules/common/dual-list/dual-list.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { IscsiCardComponent } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.component';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';
import { AuthorizedAccessFormComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';
import { AuthorizedAccessListComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-list/authorized-access-list.component';
import { DeleteExtentDialogComponent } from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { DeviceWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/device-wizard-step/device-wizard-step.component';
import { InitiatorWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/initiator-wizard-step/initiator-wizard-step.component';
import { PortalWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/portal-wizard-step/portal-wizard-step.component';
import { TargetGlobalConfigurationComponent } from 'app/pages/sharing/iscsi/target-global-configuration/target-global-configuration.component';
import { RestartSmbDialogComponent } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { UserService } from 'app/services/user.service';
import { ServiceExtraActionsComponent } from './components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from './components/shares-dashboard/service-state-button/service-state-button.component';
import { SharesDashboardComponent } from './components/shares-dashboard/shares-dashboard.component';
import { StartServiceDialogComponent } from './components/start-service-dialog/start-service-dialog.component';
import { AssociatedTargetFormComponent } from './iscsi/associated-target/associated-target-form/associated-target-form.component';
import { AssociatedTargetListComponent } from './iscsi/associated-target/associated-target-list/associated-target-list.component';
import { ExtentFormComponent } from './iscsi/extent/extent-form/extent-form.component';
import { ExtentListComponent } from './iscsi/extent/extent-list/extent-list.component';
import { InitiatorFormComponent } from './iscsi/initiator/initiator-form/initiator-form.component';
import { InitiatorListComponent } from './iscsi/initiator/initiator-list/initiator-list.component';
import { IscsiComponent } from './iscsi/iscsi.component';
import { PortalFormComponent } from './iscsi/portal/portal-form/portal-form.component';
import { PortalListComponent } from './iscsi/portal/portal-list/portal-list.component';
import { TargetFormComponent } from './iscsi/target/target-form/target-form.component';
import { TargetListComponent } from './iscsi/target/target-list/target-list.component';
import { NfsFormComponent } from './nfs/nfs-form/nfs-form.component';
import { NfsListComponent } from './nfs/nfs-list/nfs-list.component';
import { routing } from './sharing.routing';
import { SmbAclComponent } from './smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from './smb/smb-form/smb-form.component';
import { SmbListComponent } from './smb/smb-list/smb-list.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    routing,
    EntityModule,
    TranslateModule,
    MatProgressBarModule,
    MatTabsModule,
    MatCardModule,
    IxIconModule,
    FlexLayoutModule,
    MatListModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CommonDirectivesModule,
    TooltipModule,
    CastModule,
    IxFormsModule,
    TestIdModule,
    MatStepperModule,
    NgxDualListboxModule,
    IxTable2Module,
    MatToolbarModule,
  ],
  declarations: [
    NfsListComponent,
    NfsFormComponent,
    SharesDashboardComponent,
    SmbListComponent,
    SmbFormComponent,
    RestartSmbDialogComponent,
    SmbAclComponent,
    IscsiComponent,
    IscsiWizardComponent,
    DeviceWizardStepComponent,
    PortalWizardStepComponent,
    InitiatorWizardStepComponent,
    TargetGlobalConfigurationComponent,
    PortalListComponent,
    PortalFormComponent,
    InitiatorListComponent,
    InitiatorFormComponent,
    AuthorizedAccessListComponent,
    AuthorizedAccessFormComponent,
    TargetListComponent,
    TargetFormComponent,
    ExtentListComponent,
    ExtentFormComponent,
    AssociatedTargetListComponent,
    AssociatedTargetFormComponent,
    DeleteExtentDialogComponent,
    StartServiceDialogComponent,
    SmbCardComponent,
    NfsCardComponent,
    IscsiCardComponent,
    ServiceExtraActionsComponent,
    ServiceStateButtonComponent,
  ],
  providers: [
    UserService,
  ],
})
export class SharingModule {
}
