import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { routing } from './preferences.routing';
import { MaterialModule } from 'app/appMaterial.module';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { PreferencesPage } from './page/preferences.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EntityModule,
    MaterialModule,
    CoreComponents,
    routing
  ],
  declarations: [
    PreferencesPage
  ],
  providers:[EntityFormService],
  entryComponents:[
    //CardComponent
    ],
})
export class PreferencesModule { }
