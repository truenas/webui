

import { CommonModule } from '@angular/common';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../appMaterial.module';
import { MatSortHeader, MatSort } from '@angular/material';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TreeModule } from 'angular-tree-component';
import { NgUploaderModule } from 'ngx-uploader';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { RestService, WebSocketService } from '../../../services/index';
import { Ng2DropdownModule } from 'ng2-material-dropdown';

import { EntityDeleteComponent } from './entity-delete/entity-delete.component';
import { DynamicFieldDirective } from './entity-form/components/dynamic-field/dynamic-field.directive';
import { FormArrayComponent } from './entity-form/components/form-array/form-array.component';
import { FormButtonComponent } from './entity-form/components/form-button/form-button.component';
import { FormCheckboxComponent } from './entity-form/components/form-checkbox/form-checkbox.component';
import { FormInputComponent } from './entity-form/components/form-input/form-input.component';
import { FormUploadComponent } from './entity-form/components/form-upload/form-upload.component';
import { FormSelectComponent } from './entity-form/components/form-select/form-select.component';
import { FormRadioComponent } from './entity-form/components/form-radio/form-radio.component';
import { FormTextareaComponent } from './entity-form/components/form-textarea/form-textarea.component';
import { FormTextareaButtonComponent } from './entity-form/components/form-textarea-button/form-textarea-button.component';
import { FormDatepickerComponent } from './entity-form/components/form-datepicker/form-datepicker.component';

import { FormExplorerComponent } from './entity-form/components/form-explorer/form-explorer.component';
import { TooltipComponent } from './entity-form/components/tooltip/tooltip.component';
import { FormSliderComponent } from './entity-form/components/form-slider/form-slider.component';
import { FormToggleButtonComponent } from './entity-form/components/form-toggle-button/form-toggle-button.component';
import { FormTaskComponent } from './entity-form/components/form-task/form-task.component';
import { EntityFormComponent } from './entity-form/entity-form.component';
import { EntityFormEmbeddedComponent } from './entity-form/entity-form-embedded.component';
import { EntityTableActionsComponent } from './entity-table/entity-table-actions.component';
import { EntityCardActionsComponent } from './entity-card/entity-card-actions.component';
import { EntityTableAddActionsComponent } from './entity-table/entity-table-add-actions.component';
import { EntityTableComponent } from './entity-table/entity-table.component';
import { EntityCardComponent } from './entity-card/entity-card.component';
import { EntityTemplateDirective } from './entity-template.directive';
import { FormReadFileComponent } from './entity-form/components/form-readfile/form-readfile.component'

import { FormPermissionsComponent } from './entity-form/components/form-permissions/form-permissions.component';
import { EntityJobComponent } from './entity-job/entity-job.component';
import { CdkTableModule } from '@angular/cdk/table';

import { SmdFabSpeedDialTrigger, SmdFabSpeedDialActions, SmdFabSpeedDialComponent } from './fab-speed-dial/fab-speed-dial';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MaterialModule, NgxDatatableModule, CdkTableModule, TreeModule,
    Ng2DropdownModule, NgUploaderModule, FlexLayoutModule,
  ],
  declarations: [
    EntityDeleteComponent,
    EntityTableComponent,
    EntityCardComponent,
    EntityCardActionsComponent,
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
    FormTextareaComponent,
    FormTextareaButtonComponent,
    FormDatepickerComponent,
    FormExplorerComponent,
    FormPermissionsComponent,
    TooltipComponent,
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
  ],
  exports: [
    EntityDeleteComponent,
    EntityTemplateDirective,
    EntityFormComponent,
    EntityFormEmbeddedComponent,
    EntityTableComponent,
    EntityCardComponent,
    EntityCardActionsComponent,
    EntityTableAddActionsComponent,
    EntityTableActionsComponent,    
    DynamicFieldDirective,
    SmdFabSpeedDialTrigger,
    SmdFabSpeedDialActions,
    SmdFabSpeedDialComponent,
    TooltipComponent
  ],
  entryComponents: [
    FormButtonComponent,
    FormInputComponent,
    FormSelectComponent,
    FormCheckboxComponent,
    FormTextareaComponent,
    FormTextareaButtonComponent,
    FormDatepickerComponent,
    FormPermissionsComponent,
    FormArrayComponent,
    FormRadioComponent,
    FormUploadComponent,
    FormReadFileComponent,
    FormExplorerComponent,
    EntityJobComponent,
    FormSliderComponent,
    FormToggleButtonComponent,
    FormTaskComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    AppLoaderService
  ]
})
export class EntityModule {}
