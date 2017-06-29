import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { DynamicFormsCoreModule } from '@ng2-dynamic-forms/core';
import { DynamicFormsBootstrapUIModule } from '@ng2-dynamic-forms/ui-bootstrap';

import { DynamicFieldDirective } from './entity-form/components/dynamic-field/dynamic-field.directive';
import { TooltipComponent } from './entity-form/components/tooltip/tooltip.component';
import { EntityFormComponent } from './entity-form/entity-form.component';
import { FormButtonComponent } from './entity-form/components/form-button/form-button.component';
import { FormInputComponent } from './entity-form/components/form-input/form-input.component';
import { FormSelectComponent } from './entity-form/components/form-select/form-select.component';
import { FormCheckboxComponent } from './entity-form/components/form-checkbox/form-checkbox.component';
import { FormTextareaComponent } from './entity-form/components/form-textarea/form-textarea.component';
import { FormPermissionsComponent } from './entity-form/components/form-permissions/form-permissions.component';
import { FormArrayComponent } from './entity-form/components/form-array/form-array.component';

import { EntityAddComponent } from './entity-add/entity-add.component';
import { EntityConfigComponent } from './entity-config/entity-config.component';
import { EntityDeleteComponent } from './entity-delete/entity-delete.component';
import { EntityEditComponent } from './entity-edit/entity-edit.component';
import { EntityListComponent } from './entity-list/entity-list.component';
import { EntityListActionsComponent } from './entity-list/entity-list-actions.component';
import { EntityListAddActionsComponent } from './entity-list/entity-list-add-actions.component';
import { EntityTableComponent } from './entity-table/entity-table.component';
import { EntityTableActionsComponent } from './entity-table/entity-table-actions.component';
import { EntityTableAddActionsComponent } from './entity-table/entity-table-add-actions.component';
import { EntityTemplateDirective } from './entity-template.directive';
import { RangePipe } from '../../../utils/range.pipe';
import { MaterialModule } from '@angular/material';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { RestService, WebSocketService } from '../../../services/index';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DynamicFormsCoreModule.forRoot(),
    DynamicFormsBootstrapUIModule,
    NgaModule,
    MaterialModule,
    NgxDatatableModule
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
    FormPermissionsComponent,
    TooltipComponent,
    FormArrayComponent,
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
  ],
  entryComponents: [
    FormButtonComponent,
    FormInputComponent,
    FormSelectComponent,
    FormCheckboxComponent,
    FormTextareaComponent,
    FormPermissionsComponent,
    FormArrayComponent,
  ]
})
export class EntityModule { }
