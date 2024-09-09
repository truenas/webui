import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  IxModalHeaderComponent,
} from 'app/modules/forms/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { IxWarningComponent } from 'app/modules/forms/ix-forms/components/ix-warning/ix-warning.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import {
  DiskBulkEditComponent,
} from 'app/pages/storage/modules/disks/components/disk-bulk-edit/disk-bulk-edit.component';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { DiskListComponent } from 'app/pages/storage/modules/disks/components/disk-list/disk-list.component';
import {
  DiskWipeDialogComponent,
} from 'app/pages/storage/modules/disks/components/disk-wipe-dialog/disk-wipe-dialog.component';
import {
  ManualTestDialogComponent,
} from 'app/pages/storage/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { SmartTestResultListComponent } from 'app/pages/storage/modules/disks/components/smart-test-result-list/smart-test-result-list.component';
import { routes } from 'app/pages/storage/modules/disks/disks.routing';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    RouterModule.forChild(routes),
    EntityModule,
    MatCardModule,
    MatDividerModule,
    MatProgressBarModule,
    TestIdModule,
    CommonDirectivesModule,
    IxTableModule,
    IxIconModule,
    PageHeaderModule,
    SearchInput1Component,
    UnusedDiskSelectComponent,
    FormatDateTimePipe,
    IxModalHeaderComponent,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    IxWarningComponent,
    IxChipsComponent,
  ],
  declarations: [
    DiskBulkEditComponent,
    DiskFormComponent,
    DiskListComponent,
    DiskWipeDialogComponent,
    ManualTestDialogComponent,
    SmartTestResultListComponent,
  ],
})
export class DisksModule {}
