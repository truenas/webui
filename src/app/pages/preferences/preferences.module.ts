import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { routing } from './preferences.routing';
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from '../../directives/common/common-directives.module';
import { CoreComponents } from 'app/core/components/corecomponents.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { PreferencesPage } from './page/preferences.component';
import { CustomThemeComponent } from './page/forms/customtheme/customtheme.component';
import { CustomThemeManagerFormComponent } from './page/forms/custom-theme-manager-form.component';
import { GeneralPreferencesFormComponent } from './page/forms/general-preferences-form.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EntityModule,
    MaterialModule,
    CommonDirectivesModule,
    CoreComponents,
    routing
  ],
  declarations: [
    PreferencesPage,
    CustomThemeComponent,
    CustomThemeManagerFormComponent,
    GeneralPreferencesFormComponent
  ],
  providers:[EntityFormService],
  entryComponents:[
    //CardComponent
    ],
})
export class PreferencesModule { }
