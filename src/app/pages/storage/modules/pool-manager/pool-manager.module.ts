import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ConfigurationPreviewComponent } from 'app/pages/storage/modules/pool-manager/components/configuration-preview/configuration-preview.component';
import { InventoryComponent } from 'app/pages/storage/modules/pool-manager/components/inventory/inventory.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { CreateDataWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/create-data-wizard-step/create-data-wizard-step.component';
import { GeneralWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/general-wizard-step/general-wizard-step.component';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import { routes } from 'app/pages/storage/modules/pool-manager/pool-manager.routing';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

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
    CommonModule,
  ],
  declarations: [
    PoolManagerComponent,
    ConfigurationPreviewComponent,
    InventoryComponent,
    PoolManagerWizardComponent,
    GeneralWizardStepComponent,
    CreateDataWizardStepComponent,
  ],
  providers: [
    PoolManagerStore,
  ],
})

export class PoolManagerModule {
}
