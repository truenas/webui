import { ClipboardModule } from '@angular/cdk/clipboard';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { ApiKeysComponent } from './api-keys.component';
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
    routing,
  ],
  declarations: [
    ApiKeysComponent,

  ],
})
export class ApiKeysModule { }
