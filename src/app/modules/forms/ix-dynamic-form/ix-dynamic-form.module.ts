import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { IxDynamicFormItemComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxDynamicFormComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form.component';
import { IxDynamicWizardComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-wizard/ix-dynamic-wizard.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCodeEditorComponent } from 'app/modules/forms/ix-forms/components/ix-code-editor/ix-code-editor.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
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
    TranslateModule,
    ReactiveFormsModule,
    MatDividerModule,
    CastPipe,
    TooltipComponent,
    IxCodeEditorComponent,
    IxListComponent,
    IxListItemComponent,
    IxErrorsComponent,
    IxInputComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxExplorerComponent,
    IxCheckboxComponent,
    IxIpInputWithNetmaskComponent,
    IxFieldsetComponent,
    AsyncPipe,
    SchedulerComponent,
  ],
  exports: [
    ...components,
  ],
})
export class IxDynamicFormModule { }
