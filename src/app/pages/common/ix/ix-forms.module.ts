import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxComboboxComponent } from 'app/pages/common/ix/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/pages/common/ix/ix-fieldset/ix-fieldset.component';
import { IxFormComponent } from 'app/pages/common/ix/ix-form/ix-form.component';
import { IxInputComponent } from 'app/pages/common/ix/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/pages/common/ix/ix-select/ix-select.component';
import { EnclosureModule } from 'app/pages/system/view-enclosure/enclosure.module';

@NgModule({
  imports: [
    CommonModule, FormsModule,
    ReactiveFormsModule, MaterialModule,
    MarkdownModule.forRoot(), FlexLayoutModule,
    EnclosureModule, CommonDirectivesModule,
  ],
  declarations: [
    IxInputComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxFieldsetComponent,
    IxFormComponent,
  ],
  exports: [
    IxInputComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxFieldsetComponent,
    IxFormComponent,
  ],
})
export class IxFormsModule {}
