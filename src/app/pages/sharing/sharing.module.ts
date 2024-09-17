import {
  AsyncPipe, LowerCasePipe, NgClass,
} from '@angular/common';
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
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { DualListModule } from 'app/modules/lists/dual-list/dual-list.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
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
    ReactiveFormsModule,
    routing,
    EntityModule,
    TranslateModule,
    MatProgressBarModule,
    MatTabsModule,
    MatCardModule,
    IxIconModule,
    MatListModule,
    MatDialogModule,
    MatMenuModule,
    MatFormFieldModule,
    MatTooltipModule,
    AppLoaderModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TestIdModule,
    MatStepperModule,
    DualListModule,
    IxTableModule,
    MatToolbarModule,
    MatExpansionModule,
    MatButtonToggleModule,
    SearchInput1Component,
    MapValuePipe,
    IxModalHeaderComponent,
    IxFieldsetComponent,
    IxInputComponent,
    IxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    FormActionsComponent,
    IxExplorerComponent,
    IxChipsComponent,
    IxCheckboxComponent,
    IxComboboxComponent,
    IxIpInputWithNetmaskComponent,
    IxErrorsComponent,
    PageHeaderModule,
    AsyncPipe,
    LowerCasePipe,
    NgClass,
    RequiresRolesDirective,
    UiSearchDirective,
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
