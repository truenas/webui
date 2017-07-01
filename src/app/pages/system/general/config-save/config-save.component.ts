import {Component} from '@angular/core';
import {
  DynamicCheckboxModel,
  DynamicFormControlModel,
  DynamicFormService
} from '@ng2-dynamic-forms/core';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../../services/';

@Component({
  selector : 'config-save',
  template : `
  <p>Select which options you would llike to export in the config file.</p>
  <common-form [conf]="this" [busy]="sub" successMessage="Redirecting to download. Make sure you have pop up enabled in your browser." (save)="doSubmit($event)"></common-form>`
})
export class ConfigSaveComponent {

  public sub: Subscription;

  public formModel: DynamicFormControlModel[] = [
    new DynamicCheckboxModel({
      id : 'secretseed',
      label : 'Export Password Secret Seed',
    }),
  ];

  constructor(protected ws: WebSocketService) {}

  doSubmit($event) {
    this.sub = this.ws
                   .call('core.download',
                         [ 'config.save', [ $event.data ], 'freenas.db' ])
                   .subscribe(
                       (res) => {
                         $event.form.success = true;
                         window.open(res[1]);
                       },
                       (err) => { $event.form.error = err.error; });
  }
}