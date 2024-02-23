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
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
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

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClipboardModule,
    EntityModule,
    CommonDirectivesModule,
    CoreComponents,
    TranslateModule,
    IxFormsModule,
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
    IxTable2Module,
    routing,
    SearchInput1Component,
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
