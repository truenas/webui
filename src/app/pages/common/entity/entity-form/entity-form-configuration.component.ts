import { Component, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { CoreEvent } from 'app/interfaces/events';
import { TooltipsService } from 'app/services';
import { FieldSets } from './classes/field-sets';
import { EntityFormEmbeddedComponent } from './entity-form-embedded.component';
import { EntityFormComponent } from './entity-form.component';
import { FieldConfig } from './models/field-config.interface';

@Component({
  selector: 'entity-form-configuration',
  template: '',
  providers: [TooltipsService],
})
export class EntityFormConfigurationComponent implements FormConfiguration {
  @ViewChild('embeddedForm', { static: false }) embeddedForm: EntityFormEmbeddedComponent;
  @ViewChild('regularForm', { static: false }) regularForm: EntityFormComponent;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSets;

  private entityEdit: EntityFormComponent;

  title = '';
  afterModalFormClosed: () => void;
  formType: string;

  _isOneColumnForm = false;
  get isOneColumnForm(): boolean {
    return this._isOneColumnForm;
  }

  set isOneColumnForm(value) {
    this._isOneColumnForm = value;
  }

  // EntityForm
  customSubmit?: (value: any) => void;
  isEntity = true;

  // EntityFormEmbedded (This is for when your form doesn't submit to backend like view configs etc.)
  target: Subject<CoreEvent>;

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    if (this.formType == 'EntityFormComponent' && this.target && !this.customSubmit) {
      this.customSubmit = (values: any) => {
        this.target.next({
          name: 'FormSubmit',
          data: values,
          sender: this,
        });
      };
    }
  }
}
