import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule, MdTableModule } from '@angular/material';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { TreeModule } from 'ng2-tree';

import { RestService, WebSocketService } from '../../../services/index';
import { NgaModule } from '../../../theme/nga.module';
import { RangePipe } from '../../../utils/range.pipe';

import { EntityAddComponent } from './entity-add/entity-add.component';
import { EntityConfigComponent } from './entity-config/entity-config.component';
import { EntityDeleteComponent } from './entity-delete/entity-delete.component';
import { EntityEditComponent } from './entity-edit/entity-edit.component';
import { DynamicFieldDirective } from './entity-form/components/dynamic-field/dynamic-field.directive';
import { FormArrayComponent } from './entity-form/components/form-array/form-array.component';
import { FormButtonComponent } from './entity-form/components/form-button/form-button.component';
import { FormCheckboxComponent } from './entity-form/components/form-checkbox/form-checkbox.component';
import { FormInputComponent } from './entity-form/components/form-input/form-input.component';
import { FormUploadComponent } from './entity-form/components/form-upload/form-upload.component';
import { FormSelectComponent } from './entity-form/components/form-select/form-select.component';
import { FormTextareaComponent } from './entity-form/components/form-textarea/form-textarea.component';
import { FormExplorerComponent } from './entity-form/components/form-explorer/form-explorer.component';
import { TooltipComponent } from './entity-form/components/tooltip/tooltip.component';
import { EntityFormComponent } from './entity-form/entity-form.component';
import { EntityListActionsComponent } from './entity-list/entity-list-actions.component';
import { EntityListAddActionsComponent } from './entity-list/entity-list-add-actions.component';
import { EntityListComponent } from './entity-list/entity-list.component';
import { EntityTableActionsComponent } from './entity-table/entity-table-actions.component';
import { EntityTableAddActionsComponent } from './entity-table/entity-table-add-actions.component';
import { EntityTableComponent } from './entity-table/entity-table.component';
import { EntityTemplateDirective } from './entity-template.directive';

import { FormPermissionsComponent } from './entity-form/components/form-permissions/form-permissions.component';
import { EntityJobComponent } from './entity-job/entity-job.component';
import { CdkTableModule } from '@angular/cdk';

@NgModule({
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    DynamicFormsCoreModule.forRoot(), DynamicFormsBootstrapUIModule, NgaModule,
    MaterialModule, NgxDatatableModule, MdTableModule, CdkTableModule, TreeModule
  ],
  declarations: [
    EntityAddComponent,
    EntityConfigComponent,
    EntityDeleteComponent,
    EntityEditComponent,
    EntityListComponent,
    EntityListActionsComponent,
    EntityListAddActionsComponent,
    EntityTableComponent,
    EntityTableActionsComponent,
    EntityTableAddActionsComponent,
    EntityTemplateDirective,
    RangePipe,
    DynamicFieldDirective,
    EntityFormComponent,
    FormButtonComponent,
    FormInputComponent,
    FormSelectComponent,
    FormCheckboxComponent,
    FormTextareaComponent,
    FormExplorerComponent,
    FormPermissionsComponent,
    TooltipComponent,
    FormArrayComponent,
    FormUploadComponent,
    EntityJobComponent,
  ],
  exports: [
    EntityAddComponent,
    EntityConfigComponent,
    EntityDeleteComponent,
    EntityEditComponent,
    EntityListComponent,
    EntityTemplateDirective,
    EntityFormComponent,
    EntityTableComponent,
    DynamicFieldDirective,
  ],
  entryComponents: [
    FormButtonComponent,
    FormInputComponent,
    FormSelectComponent,
    FormCheckboxComponent,
    FormTextareaComponent,
    FormPermissionsComponent,
    FormArrayComponent,
    FormUploadComponent,
    FormExplorerComponent,
    EntityJobComponent
  ]
})
export class EntityModule {}
