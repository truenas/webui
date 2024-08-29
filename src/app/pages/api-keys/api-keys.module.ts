import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';

import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import {
  ApiKeyFormDialogComponent,
} from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyListComponent } from 'app/pages/api-keys/components/api-key-list/api-key-list.component';
import {
  KeyCreatedDialogComponent,
} from 'app/pages/api-keys/components/key-created-dialog/key-created-dialog.component';
import { routing } from './api-keys.routing';
import { ApiKeyComponentStore } from './store/api-key.store';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClipboardModule,
    EntityModule,
    CommonDirectivesModule,
    MatButtonModule,
    MatCardModule,
    MatSortModule,
    IxIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    TranslateModule,
    LayoutModule,
    TestIdModule,
    IxTableModule,
    routing,
    SearchInput1Component,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
  ],
  declarations: [
    ApiKeyListComponent,
    ApiKeyFormDialogComponent,
    KeyCreatedDialogComponent,
  ],
  exports: [
    ApiKeyListComponent,
  ],
  providers: [
    ApiKeyComponentStore,
  ],
})
export class ApiKeysModule { }
