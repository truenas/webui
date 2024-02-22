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
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
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
import { ReplaceDiskDialogComponent } from 'app/pages/storage/modules/disks/components/replace-disk-dialog/replace-disk-dialog.component';
import { SmartTestResultListComponent } from 'app/pages/storage/modules/disks/components/smart-test-result-list/smart-test-result-list.component';
import { routes } from 'app/pages/storage/modules/disks/disks.routing';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ReactiveFormsModule,
    IxFormsModule,
    MatButtonModule,
    MatDialogModule,
    CoreComponents,
    RouterModule.forChild(routes),
    EntityModule,
    MatCardModule,
    MatDividerModule,
    MatProgressBarModule,
    TestIdModule,
    CommonDirectivesModule,
    IxTable2Module,
    IxIconModule,
    PageHeaderModule,
    LayoutModule,
    SearchInput1Component,
  ],
  declarations: [
    DiskBulkEditComponent,
    DiskFormComponent,
    DiskListComponent,
    DiskWipeDialogComponent,
    ManualTestDialogComponent,
    ReplaceDiskDialogComponent,
    SmartTestResultListComponent,
  ],
})
export class DisksModule {}
