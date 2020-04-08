import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { routing } from './api-keys.routing';
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from '../../directives/common/common-directives.module';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { TranslateModule } from '@ngx-translate/core';

import { ApiKeysComponent } from './api-keys.component';

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
    routing
  ],
  declarations: [
    ApiKeysComponent,

  ]
})
export class ApiKeysModule { }
