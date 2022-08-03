import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
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
    AppCommonModule,
    CommonModule,
    ReactiveFormsModule,
    ClipboardModule,
    EntityModule,
    CommonDirectivesModule,
    CoreComponents,
    TranslateModule,
    IxFormsModule,
    IxTableModule,
    MatCardModule,
    MatSortModule,
    IxIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatDialogModule,
    routing,
    TranslateModule,
    LayoutModule,
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
