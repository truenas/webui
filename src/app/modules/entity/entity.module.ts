import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkTableModule } from '@angular/cdk/table';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TreeModule } from '@circlon/angular-tree-component';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgxFilesizeModule } from 'ngx-filesize';
import { NgxUploaderModule } from 'ngx-uploader';
import { TreeTableModule } from 'primeng/treetable';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityEmptyComponent } from 'app/modules/entity/entity-empty/entity-empty.component';
import { DynamicFieldDirective } from 'app/modules/entity/entity-form/components/dynamic-field/dynamic-field.directive';
import { FormArrayComponent } from 'app/modules/entity/entity-form/components/form-array/form-array.component';
import { FormButtonComponent } from 'app/modules/entity/entity-form/components/form-button/form-button.component';
import { FormCheckboxComponent } from 'app/modules/entity/entity-form/components/form-checkbox/form-checkbox.component';
import { FormChipComponent } from 'app/modules/entity/entity-form/components/form-chip/form-chip.component';
import { FormColorpickerComponent } from 'app/modules/entity/entity-form/components/form-colorpicker/form-colorpicker.component';
import { FormComboboxComponent } from 'app/modules/entity/entity-form/components/form-combobox/form-combobox.component';
import { FormDatepickerComponent } from 'app/modules/entity/entity-form/components/form-datepicker/form-datepicker.component';
import { FormDictComponent } from 'app/modules/entity/entity-form/components/form-dict/form-dict.component';
import { FormErrorsComponent } from 'app/modules/entity/entity-form/components/form-errors/form-errors.component';
import { FormExplorerComponent } from 'app/modules/entity/entity-form/components/form-explorer/form-explorer.component';
import { FormInputComponent } from 'app/modules/entity/entity-form/components/form-input/form-input.component';
import { FormIpWithNetmaskComponent } from 'app/modules/entity/entity-form/components/form-ipwithnetmask/form-ipwithnetmask.component';
import { FormLabelComponent } from 'app/modules/entity/entity-form/components/form-label/form-label.component';
import { FormListComponent } from 'app/modules/entity/entity-form/components/form-list/form-list.component';
import { FormParagraphComponent } from 'app/modules/entity/entity-form/components/form-paragraph/form-paragraph.component';
import { FormPermissionsComponent } from 'app/modules/entity/entity-form/components/form-permissions/form-permissions.component';
import { FormRadioComponent } from 'app/modules/entity/entity-form/components/form-radio/form-radio.component';
import { FormReadFileComponent } from 'app/modules/entity/entity-form/components/form-readfile/form-readfile.component';
import { FormSchedulerComponent } from 'app/modules/entity/entity-form/components/form-scheduler/form-scheduler.component';
import { FormSelectComponent } from 'app/modules/entity/entity-form/components/form-select/form-select.component';
import { FormSelectionListComponent } from 'app/modules/entity/entity-form/components/form-selection-list/form-selection-list.component';
import { FormSliderComponent } from 'app/modules/entity/entity-form/components/form-slider/form-slider.component';
import { FormStatusComponent } from 'app/modules/entity/entity-form/components/form-status/form-status.component';
import { FormTaskComponent } from 'app/modules/entity/entity-form/components/form-task/form-task.component';
import { FormTextareaButtonComponent } from 'app/modules/entity/entity-form/components/form-textarea-button/form-textarea-button.component';
import { FormTextareaComponent } from 'app/modules/entity/entity-form/components/form-textarea/form-textarea.component';
import { FormToggleButtonComponent } from 'app/modules/entity/entity-form/components/form-toggle-button/form-toggle-button.component';
import { FormUploadComponent } from 'app/modules/entity/entity-form/components/form-upload/form-upload.component';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { EntityFormService } from 'app/modules/entity/entity-form/services/entity-form.service';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityRowDetailsComponent } from 'app/modules/entity/entity-table/entity-row-details/entity-row-details.component';
import { EntityTableActionsComponent } from 'app/modules/entity/entity-table/entity-table-actions/entity-table-actions.component';
import { EntityTableAddActionsComponent } from 'app/modules/entity/entity-table/entity-table-add-actions/entity-table-add-actions.component';
import { EntityTableRowDetailsComponent } from 'app/modules/entity/entity-table/entity-table-row-details/entity-table-row-details.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTemplateDirective } from 'app/modules/entity/entity-template.directive';
import { ToolbarMultimenuComponent } from 'app/modules/entity/entity-toolbar/components/toolbar-multimenu/toolbar-multimenu.component';
import { ToolbarMultiSelectComponent } from 'app/modules/entity/entity-toolbar/components/toolbar-multiselect/toolbar-multiselect.component';
import { ToolbarSliderComponent } from 'app/modules/entity/entity-toolbar/components/toolbar-slider/toolbar-slider.component';
import { EntityTreeTableComponent } from 'app/modules/entity/entity-tree-table/entity-tree-table.component';
import { WizardSummaryComponent } from 'app/modules/entity/entity-wizard/components/wizard-summary/wizard-summary.component';
import { EntityWizardComponent } from 'app/modules/entity/entity-wizard/entity-wizard.component';
import { ExpandableTableComponent } from 'app/modules/entity/table/expandable-table/expandable-table.component';
import { TableComponent } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { TaskScheduleListComponent } from 'app/pages/data-protection/components/task-schedule-list/task-schedule-list.component';
import { AppLoaderService, DocsService, JobService } from 'app/services';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule,
    ColorPickerModule,
    NgxDatatableModule,
    CdkTableModule,
    TreeModule,
    MatListModule,
    MatDividerModule,
    IxIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatToolbarModule,
    MatExpansionModule,
    MatStepperModule,
    MatMenuModule,
    MatSortModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatPaginatorModule,
    MatDialogModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    MatRadioModule,
    TextFieldModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatChipsModule,
    MatDatepickerModule,
    NgxUploaderModule,
    FlexLayoutModule,
    TranslateModule,
    CdkTreeModule,
    OverlayModule,
    A11yModule,
    TreeTableModule,
    NgxFilesizeModule,
    CommonDirectivesModule,
    TooltipModule,
    CastModule,
    MatNativeDateModule,
    SchedulerModule,
    LayoutModule,
  ],
  declarations: [
    TaskScheduleListComponent,
    EntityTableComponent,
    EntityTableRowDetailsComponent,
    EntityRowDetailsComponent,
    EntityTreeTableComponent,
    EntityTableActionsComponent,
    EntityTableAddActionsComponent,
    EntityTemplateDirective,
    DynamicFieldDirective,
    EntityFormComponent,
    FormButtonComponent,
    FormInputComponent,
    FormLabelComponent,
    FormSelectComponent,
    FormRadioComponent,
    FormSelectionListComponent,
    FormCheckboxComponent,
    FormComboboxComponent,
    FormTextareaComponent,
    FormTextareaButtonComponent,
    FormDatepickerComponent,
    FormSchedulerComponent,
    FormListComponent,
    FormChipComponent,
    FormErrorsComponent,
    FormColorpickerComponent,
    FormExplorerComponent,
    FormPermissionsComponent,
    FormIpWithNetmaskComponent,
    FormSliderComponent,
    FormToggleButtonComponent,
    FormTaskComponent,
    FormArrayComponent,
    FormUploadComponent,
    FormReadFileComponent,
    EntityJobComponent,
    EntityWizardComponent,
    FormParagraphComponent,
    EntityDialogComponent,
    ToolbarMultimenuComponent,
    ToolbarMultiSelectComponent,
    ToolbarSliderComponent,
    FormStatusComponent,
    TableComponent,
    ExpandableTableComponent,
    EntityEmptyComponent,
    FormDictComponent,
    WizardSummaryComponent,
  ],
  exports: [
    EntityTemplateDirective,
    EntityFormComponent,
    EntityTableComponent,
    EntityRowDetailsComponent,
    EntityTreeTableComponent,
    EntityTableAddActionsComponent,
    EntityTableActionsComponent,
    DynamicFieldDirective,
    EntityWizardComponent,
    EntityDialogComponent,
    ToolbarSliderComponent,
    ToolbarMultimenuComponent,
    ToolbarMultiSelectComponent,
    TableComponent,
    ExpandableTableComponent,
    CdkTreeModule,
    EntityEmptyComponent,
    WizardSummaryComponent,
  ],
  providers: [
    EntityFormService,
    AppLoaderService,
    DocsService,
    JobService,
    TableService,
  ],
})
export class EntityModule {}
