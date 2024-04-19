import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { DualListModule } from 'app/modules/lists/dual-list/dual-list.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
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
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { NfsSessionListComponent } from 'app/pages/sharing/nfs/nfs-session-list/nfs-session-list.component';
import { RestartSmbDialogComponent } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { SmbLockListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-lock-list/smb-lock-list.component';
import { SmbNotificationListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-notification-list/smb-notification-list.component';
import { SmbShareListComponent } from 'app/pages/sharing/smb/smb-status/components/smb-share-list/smb-share-list.component';
import { ServiceExtraActionsComponent } from './components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from './components/shares-dashboard/service-state-button/service-state-button.component';
import { SharesDashboardComponent } from './components/shares-dashboard/shares-dashboard.component';
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
import { routing } from './sharing.routing';
import { SmbAclComponent } from './smb/smb-acl/smb-acl.component';
import { SmbFormComponent } from './smb/smb-form/smb-form.component';
import { SmbListComponent } from './smb/smb-list/smb-list.component';
import { SmbOpenFilesComponent } from './smb/smb-status/components/smb-open-files/smb-open-files.component';
import { SmbSessionListComponent } from './smb/smb-status/components/smb-session-list/smb-session-list.component';
import { SmbStatusComponent } from './smb/smb-status/smb-status.component';

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
    AppLoaderModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    CommonDirectivesModule,
    TooltipModule,
    CastModule,
    IxFormsModule,
    TestIdModule,
    MatStepperModule,
    DualListModule,
    IxTableModule,
    MatToolbarModule,
    CoreComponents,
    LayoutModule,
    MatExpansionModule,
    MatButtonToggleModule,
    SearchInput1Component,
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
    SmbCardComponent,
    NfsCardComponent,
    IscsiCardComponent,
    ServiceExtraActionsComponent,
    ServiceStateButtonComponent,
    SmbSessionListComponent,
    SmbLockListComponent,
    SmbOpenFilesComponent,
    NfsSessionListComponent,
    SmbStatusComponent,
    SmbShareListComponent,
    SmbNotificationListComponent,
  ],
})
export class SharingModule {
}
