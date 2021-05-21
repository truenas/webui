import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_bootenv } from 'app/helptext/system/bootenv';
import * as _ from 'lodash';
import { Observable } from 'rxjs/Observable';
import { RestService, WebSocketService } from '../../../../services';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'bootenv-replace-form',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class BootEnvReplaceFormComponent implements FormConfiguration {
  route_success: string[] = ['system', 'boot', 'status'];
  isEntity = true;
  addCall: 'boot.replace' = 'boot.replace';
  pk: any;
  isNew = true;

  protected entityForm: any;

  fieldConfig: FieldConfig[] = [
    {
      type: 'select',
      name: 'dev',
      placeholder: helptext_system_bootenv.replace_name_placeholder,
      options: [],
    },

  ];
  protected diskChoice: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}

  preInit(entityForm: any): void {
    this.route.params.subscribe((params) => {
      this.pk = params['pk'];
    });
    this.entityForm = entityForm;
  }

  afterInit(entityForm: any): void {
    this.entityForm = entityForm;
    this.diskChoice = _.find(this.fieldConfig, { name: 'dev' });
    this.ws.call('disk.get_unused').subscribe((res: any[]) => {
      res.forEach((item) => {
        this.diskChoice.options.push({ label: item.name, value: item.name });
      });
    });
    entityForm.submitFunction = this.submitFunction;
  }

  submitFunction(entityForm: any): Observable<any> {
    const payload = this.pk.substring(5, this.pk.length);
    return this.ws.call('boot.replace', [payload, entityForm.dev]);
  }
}
