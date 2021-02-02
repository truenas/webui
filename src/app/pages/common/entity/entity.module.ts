

import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../appMaterial.module';
import { ColorPickerModule } from 'ngx-color-picker';
import { MatSortHeader, MatSort } from '@angular/material/sort';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TreeModule } from 'angular-tree-component';
import { NgxUploaderModule } from 'ngx-uploader';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DocsService} from '../../../services/docs.service';
import { RestService, WebSocketService, JobService } from '../../../services/index';
import { TranslateModule } from '@ngx-translate/core';
import { TreeTableModule } from 'primeng/treetable';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';

import { DynamicFieldDirective } from './entity-form/components/dynamic-field/dynamic-field.directive';
import { FormArrayComponent } from './entity-form/components/form-array/form-array.component';
import { FormButtonComponent } from './entity-form/components/form-button/form-button.component';
import { FormCheckboxComponent } from './entity-form/components/form-checkbox/form-checkbox.component';
import { FormComboboxComponent } from './entity-form/components/form-combobox/form-combobox.component';
import { FormInputComponent } from './entity-form/components/form-input/form-input.component';
import { FormLabelComponent } from './entity-form/components/form-label/form-label.component';
import { FormUploadComponent } from './entity-form/components/form-upload/form-upload.component';
import { FormSelectComponent } from './entity-form/components/form-select/form-select.component';
import { FormRadioComponent } from './entity-form/components/form-radio/form-radio.component';
import { FormTextareaComponent } from './entity-form/components/form-textarea/form-textarea.component';
import { FormTextareaButtonComponent } from './entity-form/components/form-textarea-button/form-textarea-button.component';
import { FormDatepickerComponent } from './entity-form/components/form-datepicker/form-datepicker.component';
import { FormColorpickerComponent } from './entity-form/components/form-colorpicker/form-colorpicker.component';
import { FormParagraphComponent } from './entity-form/components/form-paragraph/form-paragraph.component';
import { FormSchedulerComponent } from './entity-form/components/form-scheduler/form-scheduler.component';
import { FormIpWithNetmaskComponent } from './entity-form/components/form-ipwithnetmask/form-ipwithnetmask.component';
import { FormListComponent } from './entity-form/components/form-list/form-list.component';
import { FormChipComponent } from './entity-form/components/form-chip/form-chip.component';
import { FormErrorsComponent } from './entity-form/components/form-errors/form-errors.component';

import { FormExplorerComponent } from './entity-form/components/form-explorer/form-explorer.component';
import { TooltipComponent } from './entity-form/components/tooltip/tooltip.component';
import { TooltipDocReplacePipe } from './entity-form/components/tooltip/tooltip-docreplace';
import { FormSliderComponent } from './entity-form/components/form-slider/form-slider.component';
import { FormToggleButtonComponent } from './entity-form/components/form-toggle-button/form-toggle-button.component';
import { FormTaskComponent } from './entity-form/components/form-task/form-task.component';
import { EntityFormComponent } from './entity-form/entity-form.component';
import { EntityFormEmbeddedComponent } from './entity-form/entity-form-embedded.component';
import { EntityFormConfigurationComponent } from './entity-form/entity-form-configuration.component';
import { DynamicComponentDirective } from './entity-table/dynamic-component.directive';
import { EntityTableActionsComponent } from './entity-table/entity-table-actions.component';
import { EntityCardActionsComponent } from './entity-card/entity-card-actions.component';
import { EntityTableAddActionsComponent } from './entity-table/entity-table-add-actions.component';
import { EntityTableService } from './entity-table/entity-table.service';
import { EntityTableComponent } from './entity-table/entity-table.component';
import { EntityTableRowDetailsComponent } from './entity-table/entity-table-row-details/entity-table-row-details.component';
import { EntityTreeTableComponent } from './entity-tree-table/entity-tree-table.component';
import { EntityCardComponent } from './entity-card/entity-card.component';
import { EntityTemplateDirective } from './entity-template.directive';
import { FormReadFileComponent } from './entity-form/components/form-readfile/form-readfile.component'
import { EntityWizardComponent } from './entity-wizard/entity-wizard.component';
import { EntityTaskComponent } from './entity-task/entity-task.component';
import { EntityDialogComponent } from './entity-dialog/entity-dialog.component';
import { EntitySnackbarComponent } from './entity-snackbar/entity-snackbar.component';
import { EntityComingsoonComponent } from './entity-comingsoon/entity-comingsoon.component';

import { FormPermissionsComponent } from './entity-form/components/form-permissions/form-permissions.component';
import { EntityJobComponent } from './entity-job/entity-job.component';

// CDK
import { CdkTableModule } from '@angular/cdk/table';
import {CdkTreeModule} from '@angular/cdk/tree';
import { OverlayModule } from '@angular/cdk/overlay';
import {A11yModule} from '@angular/cdk/a11y';

import { SmdFabSpeedDialTrigger, SmdFabSpeedDialActions, SmdFabSpeedDialComponent } from './fab-speed-dial/fab-speed-dial';

import { EntityToolbarComponent } from './entity-toolbar/entity-toolbar.component';
import { ToolbarButtonComponent } from './entity-toolbar/components/toolbar-button/toolbar-button.component';
import { ToolbarSliderComponent } from './entity-toolbar/components/toolbar-slider/toolbar-slider.component';
import { ToolbarInputComponent } from './entity-toolbar/components/toolbar-input/toolbar-input.component';
import { ToolbarCheckboxComponent } from './entity-toolbar/components/toolbar-checkbox/toolbar-checkbox.component';
import { ToolbarSelectComponent } from './entity-toolbar/components/toolbar-select/toolbar-select.component';
import { ToolbarMenuComponent } from './entity-toolbar/components/toolbar-menu/toolbar-menu.component';
import { ToolbarMultimenuComponent } from './entity-toolbar/components/toolbar-multimenu/toolbar-multimenu.component';
import { ToolbarMultiSelectComponent } from './entity-toolbar/components/toolbar-multiselect/toolbar-multiselect.component';
import { EntityRowDetailsComponent } from './entity-table/entity-row-details.component';
import { TaskScheduleListComponent } from 'app/pages/task-calendar/components/task-schedule-list/task-schedule-list.component';
import { FormStatusComponent } from './entity-form/components/form-status/form-status.component';
import { EntityDashboardComponent } from './entity-dashboard/entity-dashboard.component';
import { EntityEmptyComponent } from './entity-empty/entity-empty.component';

import { TableComponent } from './table/table.component';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DragDropModule,
    MaterialModule, ColorPickerModule, NgxDatatableModule, CdkTableModule, TreeModule.forRoot(),
    NgxUploaderModule, FlexLayoutModule, TranslateModule, CdkTreeModule,
    OverlayModule, A11yModule, TreeTableModule, NgxFilesizeModule, CommonDirectivesModule
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
    TooltipComponent,
    TooltipDocReplacePipe,
    FormSliderComponent,
    FormToggleButtonComponent,
    FormTaskComponent,
    FormArrayComponent,
    FormUploadComponent,
    FormReadFileComponent,
    EntityJobComponent,
    SmdFabSpeedDialTrigger,
    SmdFabSpeedDialActions,
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
    EntityDashboardComponent,
    EntityEmptyComponent,
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
    SmdFabSpeedDialTrigger,
    SmdFabSpeedDialActions,
    SmdFabSpeedDialComponent,
    TooltipComponent,
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
    CdkTreeModule,
    EntityEmptyComponent,
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    EntityTableService,
    AppLoaderService,
    DocsService,
    JobService
  ]
})
export class EntityModule {}
