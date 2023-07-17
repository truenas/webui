import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxDynamicFormItemComponent } from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxDynamicFormComponent } from 'app/modules/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form.component';
import { IxDynamicWizardComponent } from 'app/modules/ix-dynamic-form/components/ix-dynamic-wizard/ix-dynamic-wizard.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';

@NgModule({
  declarations: [
    IxDynamicFormComponent,
    IxDynamicFormItemComponent,
    IxDynamicWizardComponent,
  ],
  imports: [
    CommonModule,
    IxFormsModule,
    TooltipModule,
    TranslateModule,
    ReactiveFormsModule,
    CastModule,
    SchedulerModule,
    MatDividerModule,
  ],
  exports: [
    IxFormsModule,
    IxDynamicFormComponent,
    IxDynamicFormItemComponent,
    IxDynamicWizardComponent,
  ],
})
export class IxDynamicFormModule { }
