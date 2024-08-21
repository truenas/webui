import { CdkAccordionModule } from '@angular/cdk/accordion';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import {
  AclEditorListComponent,
} from 'app/pages/datasets/modules/permissions/components/acl-editor-list/acl-editor-list.component';
import {
  EditNfsAceComponent,
} from 'app/pages/datasets/modules/permissions/components/edit-nfs-ace/edit-nfs-ace.component';
import {
  EditPosixAceComponent,
} from 'app/pages/datasets/modules/permissions/components/edit-posix-ace/edit-posix-ace.component';
import {
  PermissionsItemComponent,
} from 'app/pages/datasets/modules/permissions/components/permissions-item/permissions-item.component';
import {
  SelectPresetModalComponent,
} from 'app/pages/datasets/modules/permissions/components/select-preset-modal/select-preset-modal.component';
import {
  ViewNfsPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-nfs-permissions/view-nfs-permissions.component';
import {
  ViewPosixPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-posix-permissions/view-posix-permissions.component';
import {
  ViewTrivialPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/components/view-trivial-permissions/view-trivial-permissions.component';
import {
  AclEditorSaveControlsComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/acl-editor-save-controls/acl-editor-save-controls.component';
import {
  DatasetAclEditorComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-acl-editor/dataset-acl-editor.component';
import {
  DatasetTrivialPermissionsComponent,
} from 'app/pages/datasets/modules/permissions/containers/dataset-trivial-permissions/dataset-trivial-permissions.component';
import {
  PermissionsCardComponent,
} from 'app/pages/datasets/modules/permissions/containers/permissions-card/permissions-card.component';
import { DatasetAclEditorStore } from 'app/pages/datasets/modules/permissions/stores/dataset-acl-editor.store';
import { PermissionsCardStore } from 'app/pages/datasets/modules/permissions/stores/permissions-card.store';
import { SaveAsPresetModalComponent } from './components/save-as-preset-modal/save-as-preset-modal.component';
import { StripAclModalComponent } from './components/strip-acl-modal/strip-acl-modal.component';

@NgModule({
  imports: [
    RouterModule,
    IxFormsModule,
    ReactiveFormsModule,
    CommonModule,
    TranslateModule,
    MatCardModule,
    IxIconModule,
    MatProgressSpinnerModule,
    CdkAccordionModule,
    MatTooltipModule,
    MatButtonModule,
    MatDialogModule,
    NgxSkeletonLoaderModule,
    TestIdModule,
    CommonDirectivesModule,
    EmptyComponent,
    CastPipe,
  ],
  declarations: [
    AclEditorListComponent,
    EditNfsAceComponent,
    EditPosixAceComponent,
    PermissionsItemComponent,
    SelectPresetModalComponent,
    ViewNfsPermissionsComponent,
    ViewPosixPermissionsComponent,
    ViewTrivialPermissionsComponent,
    DatasetAclEditorComponent,
    DatasetTrivialPermissionsComponent,
    PermissionsCardComponent,
    StripAclModalComponent,
    SaveAsPresetModalComponent,
    AclEditorSaveControlsComponent,
  ],
  exports: [
    PermissionsCardComponent,
  ],
  providers: [
    PermissionsCardStore,
    DatasetAclEditorStore,
  ],
})
export class PermissionsModule {
}
