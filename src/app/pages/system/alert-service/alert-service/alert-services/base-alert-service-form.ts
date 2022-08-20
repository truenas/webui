import { FormGroup } from '@angular/forms';
import helptext from 'app/helptext/system/alert-service';
import { AlertServiceEdit } from 'app/interfaces/alert-service.interface';

export abstract class BaseAlertServiceForm<T = AlertServiceEdit['attributes']> {
  abstract form: FormGroup;

  readonly helptext = helptext;

  setValues(values: T): void {
    this.form.patchValue(values);
  }

  getSubmitAttributes(): T {
    return this.form.value;
  }
}
