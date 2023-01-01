import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
// import { MatDialogModule } from '@angular/material/dialog';
import { MatStepperModule } from '@angular/material/stepper';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTreeModule } from 'app/modules/ix-tree/ix-tree.module';
import { DiskIconComponent } from 'app/pages/storage/modules/pool-manager/components/disk-icon/disk-icon.component';
import { DiskInfoComponent } from 'app/pages/storage/modules/pool-manager/components/disk-info/disk-info.component';
import { ManualDiskSelectionComponent } from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { ManualSelectionVdevComponent } from 'app/pages/storage/modules/pool-manager/components/manual-selection-vdev/manual-selection-vdev.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { GeneralWizardStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/general-wizard-step/general-wizard-step.component';
import { PoolManagerComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.component';
import { VdevWrapperComponent } from 'app/pages/storage/modules/pool-manager/components/vdev-wrapper/vdev-wrapper.component';
import { routes } from 'app/pages/storage/modules/pool-manager/pool-manager.routing';

@NgModule({
  imports: [
    AppCommonModule,
    IxFormsModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    MatDialogModule,
    MatStepperModule,
    MatDividerModule,
    IxTreeModule,
    IxIconModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    TranslateModule,
  ],
  declarations: [
    PoolManagerComponent,
    PoolManagerWizardComponent,
    DiskIconComponent,
    VdevWrapperComponent,
    DiskInfoComponent,
    ManualSelectionVdevComponent,
    GeneralWizardStepComponent,
    ManualDiskSelectionComponent,
  ],
})

export class PoolManagerModule {
}
