import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { CustomThemeManagerFormComponent } from './page/forms/custom-theme-manager-form.component';
import { GeneralPreferencesFormComponent } from './page/forms/general-preferences-form.component';
import { PreferencesPageComponent } from './page/preferences.component';
import { routing } from './preferences.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EntityModule,
    MaterialModule,
    CommonDirectivesModule,
    CoreComponents,
    TranslateModule,
    routing,
  ],
  declarations: [
    PreferencesPageComponent,
    CustomThemeManagerFormComponent,
    GeneralPreferencesFormComponent,
  ],
  providers: [EntityFormService],
  entryComponents: [],
})
export class PreferencesModule { }
