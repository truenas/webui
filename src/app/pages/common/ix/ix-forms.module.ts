import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxCombobox } from 'app/pages/common/ix/ix-combobox/ix-combobox.component';
import { IxFieldset } from 'app/pages/common/ix/ix-fieldset/ix-fieldset.component';
import { IxForm } from 'app/pages/common/ix/ix-form/ix-form.component';
import { IxInput } from 'app/pages/common/ix/ix-input/ix-input.component';
import { IxSelect } from 'app/pages/common/ix/ix-select/ix-select.component';
import { EnclosureModule } from 'app/pages/system/view-enclosure/enclosure.module';

@NgModule({
  imports: [
    CommonModule, FormsModule,
    ReactiveFormsModule, MaterialModule,
    MarkdownModule.forRoot(), FlexLayoutModule,
    EnclosureModule, CommonDirectivesModule,
  ],
  declarations: [
    IxInput,
    IxSelect,
    IxCombobox,
    IxFieldset,
    IxForm,
  ],
  exports: [
    IxInput,
    IxSelect,
    IxCombobox,
    IxFieldset,
    IxForm,
  ],
})
export class IxFormsModule {}
