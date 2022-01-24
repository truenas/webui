import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeModule } from '@circlon/angular-tree-component';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { IxCheckboxComponent } from 'app/pages/common/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/pages/common/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/pages/common/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxCombobox2Component } from 'app/pages/common/ix-forms/components/ix-combobox2/ix-combobox2.component';
import { IxErrorsComponent } from 'app/pages/common/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/pages/common/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/pages/common/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/pages/common/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/pages/common/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/pages/common/ix-forms/components/ix-select/ix-select.component';
import { IxSlideInComponent } from 'app/pages/common/ix-forms/components/ix-slide-in/ix-slide-in.component';
import { IxSlideToggleComponent } from 'app/pages/common/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxTextareaComponent } from 'app/pages/common/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxUserComboboxComponent } from 'app/pages/common/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { IxFormatterService } from 'app/pages/common/ix-forms/services/ix-formatter.service';
import IxUsersService from 'app/pages/common/ix-forms/services/ix-users.service';
import IxValidatorsService from 'app/pages/common/ix-forms/services/ix-validators.service';
import { EnclosureModule } from 'app/pages/system/view-enclosure/enclosure.module';
import { IxModalHeaderComponent } from './components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    MarkdownModule.forRoot(),
    FlexLayoutModule,
    EnclosureModule,
    CommonDirectivesModule,
    TooltipModule,
    TranslateModule,
    TreeModule,
  ],
  declarations: [
    IxInputComponent,
    IxErrorsComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxCombobox2Component,
    IxFieldsetComponent,
    IxSlideInComponent,
    IxModalHeaderComponent,
    IxCheckboxComponent,
    IxUserComboboxComponent,
    IxTextareaComponent,
    IxChipsComponent,
    IxExplorerComponent,
    IxFileInputComponent,
    IxSlideToggleComponent,
  ],
  exports: [
    IxErrorsComponent,
    IxInputComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxCombobox2Component,
    IxSlideInComponent,
    IxModalHeaderComponent,
    IxFieldsetComponent,
    IxUserComboboxComponent,
    IxCheckboxComponent,
    IxTextareaComponent,
    IxChipsComponent,
    IxExplorerComponent,
    IxFileInputComponent,
    IxSlideToggleComponent,
  ],
  providers: [
    IxFormatterService,
    IxValidatorsService,
    IxUsersService,
  ],
})
export class IxFormsModule {}
