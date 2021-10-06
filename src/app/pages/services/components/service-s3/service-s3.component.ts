import {
  ApplicationRef, Component, Injector,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/services/components/service-s3';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { S3Config, S3ConfigUpdate } from 'app/interfaces/s3-config.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import {
  DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 's3-edit',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [SystemGeneralService],
})

export class ServiceS3Component implements FormConfiguration {
  // protected resource_name: string = 'services/s3';
  queryCall: 's3.config' = 's3.config';
  updateCall = 's3.update';
  route_success: string[] = ['services'];
  private certificate: FormSelectConfig;
  private initial_path: string;
  private warned = false;
  private validBindIps: string[] = [];
  title = helptext.formTitle;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_title,
      class: 'group-configuration-form',
      label: true,
      config: [
        {
          type: 'select',
          name: 'bindip',
          placeholder: helptext.bindip_placeholder,
          tooltip: helptext.bindip_tooltip,
          options: helptext.bindip_options,
        },
        {
          type: 'input',
          name: 'bindport',
          placeholder: helptext.bindport_placeholder,
          tooltip: helptext.bindport_tooltip,
          value: '9000',
          required: true,
          validation: helptext.bindport_validation,
        },
        {
          type: 'input',
          name: 'access_key',
          placeholder: helptext.access_key_placeholder,
          tooltip: helptext.access_key_tooltip,
          required: true,
          validation: helptext.access_key_validation,
        },
        {
          type: 'input',
          name: 'secret_key',
          placeholder: helptext.secret_key_placeholder,
          togglePw: true,
          tooltip: helptext.secret_key_tooltip,
          inputType: 'password',
          validation: helptext.secret_key_validation,
        },
        {
          type: 'explorer',
          initial: '/mnt',
          explorerType: 'directory',
          name: 'storage_path',
          placeholder: helptext.storage_path_placeholder,
          tooltip: helptext.storage_path_tooltip,
          required: true,
          validation: helptext.storage_path_validation,
        },
        {
          type: 'checkbox',
          name: 'browser',
          placeholder: helptext.browser_placeholder,
          tooltip: helptext.browser_tooltip,
        },
        /*  This is to be enabled when the mode feature is finished and fully implemented for S3
      {
        type : 'select',
        name : 'mode',
        placeholder : helptext.mode_placeholder,
        options : helptext.mode_options
      },
  */
        {
          type: 'select',
          name: 'certificate',
          placeholder: helptext.certificate_placeholder,
          tooltip: helptext.certificate_tooltip,
          options: [{ label: '---', value: null }],
        },
      ],
    }, {
      name: 'divider',
      divider: true,
    }];
  protected storage_path: AbstractControl;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected systemGeneralService: SystemGeneralService,
    private dialog: DialogService,
  ) {}

  afterInit(entityForm: EntityFormComponent): void {
    this.storage_path = entityForm.formGroup.controls['storage_path'];
    this.storage_path.valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      if (res && res != this.initial_path && !this.warned) {
        this.dialog
          .confirm({
            title: helptext.path_warning_title,
            message: helptext.path_warning_msg,
          })
          .pipe(untilDestroyed(this))
          .subscribe(() => {
            if (!window.confirm) {
              this.storage_path.setValue(this.initial_path);
            } else {
              this.warned = true;
            }
          });
      }
    });
    this.systemGeneralService.getCertificates().pipe(untilDestroyed(this)).subscribe((res) => {
      this.certificate = _.find(this.fieldConfig, { name: 'certificate' }) as FormSelectConfig;
      if (res.length > 0) {
        res.forEach((item) => {
          this.certificate.options.push({ label: item.name, value: item.id });
        });
      }
    });
    this.ws
      .call('s3.bindip_choices')
      .pipe(
        map((response) =>
          Object.keys(response || {}).map((key) => ({
            label: response[key],
            value: key,
          }))),
      )
      .pipe(untilDestroyed(this)).subscribe((choices) => {
        choices.forEach((ip) => {
          this.validBindIps.push(ip.value);
        });

        const config = _.find(this.fieldConfig, { name: 'bindip' }) as FormSelectConfig;
        config.options = choices;
      });
    entityForm.submitFunction = this.submitFunction;
  }

  resourceTransformIncomingRestData(data: any): any {
    if (data.certificate && data.certificate.id) {
      data['certificate'] = data.certificate.id;
    }
    if (data.storage_path) {
      this.initial_path = data.storage_path;
    }

    // If validIps is slow to load, skip check on load (It's still done on save)
    if (this.validBindIps.length > 0) {
      return this.compareBindIps(data);
    }
    return data;
  }

  compareBindIps(data: any): any {
    if (data.bindip && this.validBindIps.length > 0) {
      if (!this.validBindIps.includes(data.bindip)) {
        data.bindip = '';
      }
    }
    return data;
  }

  submitFunction(configUpdate: S3ConfigUpdate): Observable<S3Config> {
    return this.ws.call('s3.update', [configUpdate]);
  }

  beforeSubmit(data: any): void {
    this.compareBindIps(data);
  }
}
