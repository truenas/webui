import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { IxDynamicFormItemComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxDynamicFormComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form.component';
import { IxDynamicWizardComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-wizard/ix-dynamic-wizard.component';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

const components = [
  IxDynamicFormComponent,
  IxDynamicFormItemComponent,
  IxDynamicWizardComponent,
];

@NgModule({
  declarations: [
    ...components,
  ],
  imports: [
    CommonModule,
    IxFormsModule,
    TranslateModule,
    ReactiveFormsModule,
    SchedulerModule,
    MatDividerModule,
    CastPipe,
    TooltipComponent,
  ],
  exports: [
    IxFormsModule,
    ...components,
  ],
})
export class IxDynamicFormModule { }
