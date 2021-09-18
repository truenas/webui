import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxCombobox } from 'app/pages/common/ix/components/ix-combobox/ix-combobox.component';
import { IxFieldset } from 'app/pages/common/ix/components/ix-fieldset/ix-fieldset.component';
import { IxForm } from 'app/pages/common/ix/components/ix-form/ix-form.component';
import { IxInput } from 'app/pages/common/ix/components/ix-input/ix-input.component';
import { IxModalComponent } from 'app/pages/common/ix/components/ix-modal/ix-modal.component';
import { IxModalDirective } from 'app/pages/common/ix/components/ix-modal/ix-modal.directive';
import { IxSelect } from 'app/pages/common/ix/components/ix-select/ix-select.component';
import { EnclosureModule } from 'app/pages/system/view-enclosure/enclosure.module';

@NgModule({
  imports: [
    CommonModule, FormsModule,
    ReactiveFormsModule, MaterialModule,
    MarkdownModule.forRoot(), FlexLayoutModule,
    EnclosureModule, CommonDirectivesModule, TranslateModule,
  ],
  declarations: [
    IxInput,
    IxSelect,
    IxCombobox,
    IxFieldset,
    IxForm,
    IxModalComponent,
    IxModalDirective,
  ],
  exports: [
    IxInput,
    IxSelect,
    IxCombobox,
    IxFieldset,
    IxForm,
    IxModalComponent,
  ],
})
export class IxFormsModule {}
