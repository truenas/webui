import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { GeneralWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/general-wizard-step/general-wizard-step.component';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import { routes } from 'app/pages/storage/modules/pool-manager/pool-manager.routing';

@NgModule({
  imports: [
    AppCommonModule,
    IxFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatStepperModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslateModule,
  ],
  declarations: [
    PoolManagerComponent,
    PoolManagerWizardComponent,
    GeneralWizardStepComponent,
  ],
})

export class PoolManagerModule {
}
