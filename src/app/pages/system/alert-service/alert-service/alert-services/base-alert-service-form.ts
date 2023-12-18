import { FormGroup } from '@angular/forms';
import { helptextAlertService } from 'app/helptext/system/alert-service';
import { AlertServiceEdit } from 'app/interfaces/alert-service.interface';

export abstract class BaseAlertServiceForm<T = AlertServiceEdit['attributes']> {
  abstract form: FormGroup;

  readonly helptext = helptextAlertService;

  setValues(values: T): void {
    this.form.patchValue(values);
  }

  getSubmitAttributes(): T {
    return this.form.value;
  }
}
