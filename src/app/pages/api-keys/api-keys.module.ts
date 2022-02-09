import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import {
  ApiKeyFormDialogComponent,
} from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeysComponent } from 'app/pages/api-keys/components/api-keys/api-keys.component';
import {
  KeyCreatedDialogComponent,
} from 'app/pages/api-keys/components/key-created-dialog/key-created-dialog.component';
import { routing } from './api-keys.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
    EntityModule,
    MaterialModule,
    CommonDirectivesModule,
    CoreComponents,
    TranslateModule,
    IxFormsModule,
    routing,
  ],
  declarations: [
    ApiKeysComponent,
    ApiKeyFormDialogComponent,
    KeyCreatedDialogComponent,
  ],
})
export class ApiKeysModule { }
