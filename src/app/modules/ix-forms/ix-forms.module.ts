import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TreeModule } from '@bugsplat/angular-tree-component';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxCheckboxComponent } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxCheckboxListComponent } from 'app/modules/ix-forms/components/ix-checkbox-list/ix-checkbox-list.component';
import { IxChipsComponent } from 'app/modules/ix-forms/components/ix-chips/ix-chips.component';
import { IxComboboxComponent } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxErrorsComponent } from 'app/modules/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/ix-forms/components/ix-list/ix-list.component';
import { IxPermissionsComponent } from 'app/modules/ix-forms/components/ix-permissions/ix-permissions.component';
import { IxRadioGroupComponent } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/ix-forms/components/ix-select/ix-select.component';
import { IxModalHeaderComponent } from 'app/modules/ix-forms/components/ix-slide-in/components/ix-modal-header/ix-modal-header.component';
import { IxSlideToggleComponent } from 'app/modules/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { IxStarRatingComponent } from 'app/modules/ix-forms/components/ix-star-rating/ix-star-rating.component';
import { IxTextareaComponent } from 'app/modules/ix-forms/components/ix-textarea/ix-textarea.component';
import { IxWarningComponent } from 'app/modules/ix-forms/components/ix-warning/ix-warning.component';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { FormActionsComponent } from './components/form-actions/form-actions.component';
import { IxLabelComponent } from './components/ix-label/ix-label.component';
import { IxSlideInComponent } from './components/ix-slide-in/ix-slide-in.component';
import { WithManageCertificatesLinkComponent } from './components/with-manage-certificates-link/with-manage-certificates-link.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
    IxIconModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatRadioModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatCheckboxModule,
    CommonDirectivesModule,
    TooltipModule,
    TranslateModule,
    TreeModule,
    MatListModule,
    CastModule,
    TestIdModule,
    RouterLink,
  ],
  declarations: [
    IxInputComponent,
    IxErrorsComponent,
    IxWarningComponent,
    IxSelectComponent,
    IxFieldsetComponent,
    IxSlideInComponent,
    IxModalHeaderComponent,
    IxCheckboxComponent,
    IxTextareaComponent,
    IxListComponent,
    IxListItemComponent,
    IxComboboxComponent,
    IxPermissionsComponent,
    IxChipsComponent,
    IxExplorerComponent,
    IxFileInputComponent,
    IxSlideToggleComponent,
    IxRadioGroupComponent,
    IxIpInputWithNetmaskComponent,
    IxCheckboxListComponent,
    IxLabelComponent,
    FormActionsComponent,
    WithManageCertificatesLinkComponent,
    IxStarRatingComponent,
  ],
  exports: [
    IxErrorsComponent,
    IxWarningComponent,
    IxInputComponent,
    IxSelectComponent,
    IxSlideInComponent,
    IxModalHeaderComponent,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxPermissionsComponent,
    IxTextareaComponent,
    IxListComponent,
    IxListItemComponent,
    IxChipsComponent,
    IxComboboxComponent,
    IxExplorerComponent,
    IxFileInputComponent,
    IxSlideToggleComponent,
    IxRadioGroupComponent,
    IxIpInputWithNetmaskComponent,
    IxCheckboxListComponent,
    IxLabelComponent,
    FormActionsComponent,
    WithManageCertificatesLinkComponent,
    IxStarRatingComponent,
  ],
  providers: [
    IxFormatterService,
    IxValidatorsService,
  ],
})
export class IxFormsModule {}
