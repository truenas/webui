import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkTableModule } from '@angular/cdk/table';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TreeModule } from 'angular-tree-component';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgxFilesizeModule } from 'ngx-filesize';
import { NgxUploaderModule } from 'ngx-uploader';
import { TreeTableModule } from 'primeng/treetable';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { FormSelectionListComponent } from 'app/pages/common/entity/entity-form/components/form-selection-list/form-selection-list.component';
import { EntityFormService } from 'app/pages/common/entity/entity-form/services/entity-form.service';
import { EntityRowDetailsComponent } from 'app/pages/common/entity/entity-table/entity-row-details/entity-row-details.component';
import { EntityTableActionsComponent } from 'app/pages/common/entity/entity-table/entity-table-actions/entity-table-actions.component';
import { EntityTableAddActionsComponent } from 'app/pages/common/entity/entity-table/entity-table-add-actions/entity-table-add-actions.component';
import { WizardSummaryComponent } from 'app/pages/common/entity/entity-wizard/components/wizard-summary/wizard-summary.component';
import { ExpandableTableComponent } from 'app/pages/common/entity/table/expandable-table/expandable-table.component';
import { TaskScheduleListComponent } from 'app/pages/data-protection/components/task-schedule-list/task-schedule-list.component';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DocsService } from 'app/services/docs.service';
import { JobService } from 'app/services/index';
import { EntityCardActionsComponent } from './entity-card/entity-card-actions.component';
import { EntityCardComponent } from './entity-card/entity-card.component';
import { EntityComingsoonComponent } from './entity-comingsoon/entity-comingsoon.component';
import { EntityDashboardComponent } from './entity-dashboard/entity-dashboard.component';
import { EntityDialogComponent } from './entity-dialog/entity-dialog.component';
import { EntityEmptyComponent } from './entity-empty/entity-empty.component';
import { DynamicFieldDirective } from './entity-form/components/dynamic-field/dynamic-field.directive';
import { FormArrayComponent } from './entity-form/components/form-array/form-array.component';
import { FormButtonComponent } from './entity-form/components/form-button/form-button.component';
import { FormCheckboxComponent } from './entity-form/components/form-checkbox/form-checkbox.component';
import { FormChipComponent } from './entity-form/components/form-chip/form-chip.component';
import { FormColorpickerComponent } from './entity-form/components/form-colorpicker/form-colorpicker.component';
import { FormComboboxComponent } from './entity-form/components/form-combobox/form-combobox.component';
import { FormDatepickerComponent } from './entity-form/components/form-datepicker/form-datepicker.component';
import { FormDictComponent } from './entity-form/components/form-dict/form-dict.component';
import { FormErrorsComponent } from './entity-form/components/form-errors/form-errors.component';
import { FormExplorerComponent } from './entity-form/components/form-explorer/form-explorer.component';
import { FormInputComponent } from './entity-form/components/form-input/form-input.component';
import { FormIpWithNetmaskComponent } from './entity-form/components/form-ipwithnetmask/form-ipwithnetmask.component';
import { FormLabelComponent } from './entity-form/components/form-label/form-label.component';
import { FormListComponent } from './entity-form/components/form-list/form-list.component';
import { FormParagraphComponent } from './entity-form/components/form-paragraph/form-paragraph.component';
import { FormPermissionsComponent } from './entity-form/components/form-permissions/form-permissions.component';
import { FormRadioComponent } from './entity-form/components/form-radio/form-radio.component';
import { FormReadFileComponent } from './entity-form/components/form-readfile/form-readfile.component';
import { FormSchedulerComponent } from './entity-form/components/form-scheduler/form-scheduler.component';
import { FormSelectComponent } from './entity-form/components/form-select/form-select.component';
import { FormSliderComponent } from './entity-form/components/form-slider/form-slider.component';
import { FormStatusComponent } from './entity-form/components/form-status/form-status.component';
import { FormTaskComponent } from './entity-form/components/form-task/form-task.component';
import { FormTextareaButtonComponent } from './entity-form/components/form-textarea-button/form-textarea-button.component';
import { FormTextareaComponent } from './entity-form/components/form-textarea/form-textarea.component';
import { FormToggleButtonComponent } from './entity-form/components/form-toggle-button/form-toggle-button.component';
import { FormUploadComponent } from './entity-form/components/form-upload/form-upload.component';
import { EntityFormConfigurationComponent } from './entity-form/entity-form-configuration.component';
import { EntityFormEmbeddedComponent } from './entity-form/entity-form-embedded.component';
import { EntityFormComponent } from './entity-form/entity-form.component';
import { EntityJobComponent } from './entity-job/entity-job.component';
import { EntitySnackbarComponent } from './entity-snackbar/entity-snackbar.component';
import { DynamicComponentDirective } from './entity-table/dynamic-component.directive';
import { EntityTableRowDetailsComponent } from './entity-table/entity-table-row-details/entity-table-row-details.component';
import { EntityTableComponent } from './entity-table/entity-table.component';
import { EntityTaskComponent } from './entity-task/entity-task.component';
import { EntityTemplateDirective } from './entity-template.directive';
import { ToolbarButtonComponent } from './entity-toolbar/components/toolbar-button/toolbar-button.component';
import { ToolbarCheckboxComponent } from './entity-toolbar/components/toolbar-checkbox/toolbar-checkbox.component';
import { ToolbarInputComponent } from './entity-toolbar/components/toolbar-input/toolbar-input.component';
import { ToolbarMenuComponent } from './entity-toolbar/components/toolbar-menu/toolbar-menu.component';
import { ToolbarMultimenuComponent } from './entity-toolbar/components/toolbar-multimenu/toolbar-multimenu.component';
import { ToolbarMultiSelectComponent } from './entity-toolbar/components/toolbar-multiselect/toolbar-multiselect.component';
import { ToolbarSelectComponent } from './entity-toolbar/components/toolbar-select/toolbar-select.component';
import { ToolbarSliderComponent } from './entity-toolbar/components/toolbar-slider/toolbar-slider.component';
import { EntityToolbarComponent } from './entity-toolbar/entity-toolbar.component';
import { EntityTreeTableComponent } from './entity-tree-table/entity-tree-table.component';
import { EntityWizardComponent } from './entity-wizard/entity-wizard.component';
import { SmdFabSpeedDialTriggerComponent, SmdFabSpeedDialActionsComponent, SmdFabSpeedDialComponent } from './fab-speed-dial/fab-speed-dial';
import { TableComponent } from './table/table.component';
import { TableService } from './table/table.service';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DragDropModule, RouterModule,
    MaterialModule, ColorPickerModule, NgxDatatableModule, CdkTableModule, TreeModule.forRoot(),
    NgxUploaderModule, FlexLayoutModule, TranslateModule, CdkTreeModule,
    OverlayModule, A11yModule, TreeTableModule, NgxFilesizeModule, CommonDirectivesModule,
    TooltipModule,
  ],
  declarations: [
    TaskScheduleListComponent,
    EntityTableComponent,
    EntityTableRowDetailsComponent,
    EntityRowDetailsComponent,
    EntityTreeTableComponent,
    EntityCardComponent,
    EntityCardActionsComponent,
    DynamicComponentDirective,
    EntityTableActionsComponent,
    EntityTableAddActionsComponent,
    EntityTemplateDirective,
    DynamicFieldDirective,
    EntityFormComponent,
    EntityFormEmbeddedComponent,
    EntityFormConfigurationComponent,
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
    SmdFabSpeedDialTriggerComponent,
    SmdFabSpeedDialActionsComponent,
    SmdFabSpeedDialComponent,
    EntityWizardComponent,
    EntityTaskComponent,
    FormParagraphComponent,
    EntityDialogComponent,
    EntitySnackbarComponent,
    EntityToolbarComponent,
    ToolbarButtonComponent,
    ToolbarSliderComponent,
    ToolbarInputComponent,
    ToolbarCheckboxComponent,
    ToolbarSelectComponent,
    ToolbarMenuComponent,
    ToolbarMultimenuComponent,
    ToolbarMultiSelectComponent,
    FormStatusComponent,
    EntityComingsoonComponent,
    TableComponent,
    ExpandableTableComponent,
    EntityDashboardComponent,
    EntityEmptyComponent,
    FormDictComponent,
    WizardSummaryComponent,
  ],
  exports: [
    EntityTemplateDirective,
    EntityFormComponent,
    EntityFormEmbeddedComponent,
    EntityFormConfigurationComponent,
    DynamicComponentDirective,
    EntityTableComponent,
    EntityRowDetailsComponent,
    EntityTreeTableComponent,
    EntityCardComponent,
    EntityCardActionsComponent,
    EntityTableAddActionsComponent,
    EntityTableActionsComponent,
    DynamicFieldDirective,
    SmdFabSpeedDialTriggerComponent,
    SmdFabSpeedDialActionsComponent,
    SmdFabSpeedDialComponent,
    EntityWizardComponent,
    EntityTaskComponent,
    EntityDialogComponent,
    EntitySnackbarComponent,
    EntityToolbarComponent,
    ToolbarButtonComponent,
    ToolbarSliderComponent,
    ToolbarInputComponent,
    ToolbarCheckboxComponent,
    ToolbarSelectComponent,
    ToolbarMenuComponent,
    ToolbarMultimenuComponent,
    ToolbarMultiSelectComponent,
    EntityComingsoonComponent,
    TableComponent,
    ExpandableTableComponent,
    CdkTreeModule,
    EntityEmptyComponent,
    WizardSummaryComponent,
  ],
  entryComponents: [
    FormButtonComponent,
    FormInputComponent,
    FormLabelComponent,
    FormSelectComponent,
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
    FormPermissionsComponent,
    FormArrayComponent,
    FormSelectionListComponent,
    FormRadioComponent,
    FormUploadComponent,
    FormReadFileComponent,
    FormExplorerComponent,
    FormIpWithNetmaskComponent,
    EntityJobComponent,
    FormSliderComponent,
    FormToggleButtonComponent,
    FormTaskComponent,
    FormParagraphComponent,
    EntityToolbarComponent,
    EntitySnackbarComponent,
    EntityTableRowDetailsComponent,
    TaskScheduleListComponent,
    FormDictComponent,
    EntityDialogComponent,
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
