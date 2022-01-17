import { Component, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { CoreEvent } from 'app/interfaces/events';
import { FieldSets } from 'app/modules/entity/entity-form/classes/field-sets';
import { EntityFormEmbeddedComponent } from 'app/modules/entity/entity-form/entity-form-embedded.component';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'entity-form-configuration',
  template: '',
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

  isOneColumnForm = false;

  // EntityForm
  customSubmit?: (value: any) => void;
  isEntity = true;

  // EntityFormEmbedded (This is for when your form doesn't submit to backend like view configs etc.)
  target: Subject<CoreEvent>;

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityEdit = entityEdit;
    if (this.formType === 'EntityFormComponent' && this.target && !this.customSubmit) {
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
