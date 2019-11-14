

import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../appMaterial.module';
import { ColorPickerModule } from 'ngx-color-picker';
import { MatSortHeader, MatSort } from '@angular/material';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TreeModule } from 'angular-tree-component';
import { NgUploaderModule } from 'ngx-uploader';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DocsService} from '../../../services/docs.service';
import { RestService, WebSocketService, JobService } from '../../../services/index';
import { Ng2DropdownModule } from 'ng2-material-dropdown';
import { TranslateModule } from '@ngx-translate/core';
import { TreeTableModule } from 'primeng/treetable';
import { FileSizeModule } from 'ngx-filesize';

import { DynamicFieldDirective } from './entity-form/components/dynamic-field/dynamic-field.directive';
import { FormArrayComponent } from './entity-form/components/form-array/form-array.component';
import { FormButtonComponent } from './entity-form/components/form-button/form-button.component';
import { FormCheckboxComponent } from './entity-form/components/form-checkbox/form-checkbox.component';
import { FormComboboxComponent } from './entity-form/components/form-combobox/form-combobox.component';
import { FormInputComponent } from './entity-form/components/form-input/form-input.component';
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

import { FormExplorerComponent } from './entity-form/components/form-explorer/form-explorer.component';
import { TooltipComponent } from './entity-form/components/tooltip/tooltip.component';
import { TooltipDocReplacePipe } from './entity-form/components/tooltip/tooltip-docreplace';
import { FormSliderComponent } from './entity-form/components/form-slider/form-slider.component';
import { FormToggleButtonComponent } from './entity-form/components/form-toggle-button/form-toggle-button.component';
import { FormTaskComponent } from './entity-form/components/form-task/form-task.component';
import { EntityFormComponent } from './entity-form/entity-form.component';
import { EntityFormEmbeddedComponent } from './entity-form/entity-form-embedded.component';
import { DynamicComponentDirective } from './entity-table/dynamic-component.directive';
import { EntityTableActionsComponent } from './entity-table/entity-table-actions.component';
import { EntityCardActionsComponent } from './entity-card/entity-card-actions.component';
import { EntityTableAddActionsComponent } from './entity-table/entity-table-add-actions.component';
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

import { FormPermissionsComponent } from './entity-form/components/form-permissions/form-permissions.component';
import { EntityJobComponent } from './entity-job/entity-job.component';

// CDK
import { CdkTableModule } from '@angular/cdk/table';
import { OverlayModule } from '@angular/cdk/overlay';
import {A11yModule} from '@angular/cdk/a11y';

import { SmdFabSpeedDialTrigger, SmdFabSpeedDialActions, SmdFabSpeedDialComponent } from './fab-speed-dial/fab-speed-dial';
import { EntityDashboardComponent } from './entity-dashboard/entity-dashboard.component';

import { EntityToolbarComponent } from './entity-toolbar/entity-toolbar.component';
import { ToolbarButtonComponent } from './entity-toolbar/components/toolbar-button/toolbar-button.component';
import { ToolbarMenuComponent } from './entity-toolbar/components/toolbar-menu/toolbar-menu.component';
import { ToolbarMultimenuComponent } from './entity-toolbar/components/toolbar-multimenu/toolbar-multimenu.component';
import { EntityRowDetailsComponent } from './entity-table/entity-row-details.component';
import { TaskScheduleListComponent } from 'app/pages/task-calendar/components/task-schedule-list/task-schedule-list.component';
import { DataTableCellDirective } from './entity-table/data-table-cell.directive';
import { FormStatusComponent } from './entity-form/components/form-status/form-status.component';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DragDropModule,
    MaterialModule, ColorPickerModule, NgxDatatableModule, CdkTableModule, TreeModule.forRoot(),
    Ng2DropdownModule, NgUploaderModule, FlexLayoutModule, TranslateModule,
    OverlayModule, A11yModule, TreeTableModule, FileSizeModule
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
    FormButtonComponent,
    FormInputComponent,
    FormSelectComponent,
    FormRadioComponent,
    FormCheckboxComponent,
    FormComboboxComponent,
    FormTextareaComponent,
    FormTextareaButtonComponent,
    FormDatepickerComponent,
    FormSchedulerComponent,
    FormListComponent,
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
    EntityDashboardComponent,
    EntityToolbarComponent,
    ToolbarButtonComponent,
    ToolbarMenuComponent,
    ToolbarMultimenuComponent,
    DataTableCellDirective,
    FormStatusComponent
  ],
  exports: [
    EntityTemplateDirective,
    EntityFormComponent,
    EntityFormEmbeddedComponent,
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
    EntityDashboardComponent,
    EntityToolbarComponent,
    ToolbarButtonComponent,
    ToolbarMenuComponent,
    ToolbarMultimenuComponent,
    DataTableCellDirective
  ],
  entryComponents: [
    FormButtonComponent,
    FormInputComponent,
    FormSelectComponent,
    FormCheckboxComponent,
    FormComboboxComponent,
    FormTextareaComponent,
    FormTextareaButtonComponent,
    FormDatepickerComponent,
    FormSchedulerComponent,
    FormListComponent,
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
    TaskScheduleListComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    AppLoaderService,
    DocsService,
    JobService
  ]
})
export class EntityModule {}
