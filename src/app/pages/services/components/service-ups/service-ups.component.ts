import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-ups';

@Component({
  selector : 'ups-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceUPSComponent {
  protected ups_driver: any;
  protected ups_driver_fg: any;
  protected ups_port: any;
  protected entityForm: any;

  protected resource_name: string = 'services/ups';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'ups_mode',
      placeholder : helptext.ups_mode_placeholder,
      tooltip : helptext.ups_mode_tooltip,
      options : helptext.ups_mode_options
    },
    {
      type : 'input',
      name : 'ups_identifier',
      placeholder : helptext.ups_identifier_placeholder,
      tooltip : helptext.ups_identifier_tooltip,
      required: true,
      validation : helptext.ups_identifier_validation
    },
    {
      type : 'input',
      name : 'ups_remotehost',
      placeholder : helptext.ups_remotehost_placeholder,
      tooltip : helptext.ups_remotehost_tooltip,
      required: true,
      isHidden: true,
      validation : helptext.ups_remotehost_validation
    },
    {
      type : 'input',
      name : 'ups_remoteport',
      placeholder : helptext.ups_remoteport_placeholder,
      tooltip : helptext.ups_remoteport_tooltip,
      value : helptext.ups_remoteport_value,
      required: true,
      isHidden: true,
      validation : helptext.ups_remoteport_validation
    },
    {
      type : 'select',
      name : 'ups_driver',
      placeholder : helptext.ups_driver_placeholder,
      tooltip : helptext.ups_driver_tooltip,
      required: true,
      options: [],
      validation : helptext.ups_driver_validation,
      isHidden: false
    },
    {
      type : 'combobox',
      name : 'ups_port',
      placeholder : helptext.ups_port_placeholder,
      options: [],
      tooltip : helptext.ups_port_tooltip,
      required: true,
      validation : helptext.ups_port_validation,
      isHidden: false
    },
    {
      type : 'textarea',
      name : 'ups_options',
      placeholder : helptext.ups_options_placeholder,
      tooltip : helptext.ups_options_tooltip,
      isHidden: false
    },
    {
      type : 'textarea',
      name : 'ups_optionsupsd',
      placeholder : helptext.ups_optionsupsd_placeholder,
      tooltip : helptext.ups_optionsupsd_tooltip,
    },
    {
      type : 'input',
      name : 'ups_description',
      placeholder : helptext.ups_description_placeholder,
      tooltip : helptext.ups_description_tooltip,
    },
    {
      type : 'select',
      name : 'ups_shutdown',
      placeholder : helptext.ups_shutdown_placeholder,
      tooltip : helptext.ups_shutdown_tooltip,
      options : helptext.ups_shutdown_options
    },
    {
      type : 'input',
      inputType: 'number',
      name : 'ups_shutdowntimer',
      placeholder : helptext.ups_shutdowntimer_placeholder,
      tooltip : helptext.ups_shutdowntimer_tooltip,
    },
    {
      type : 'input',
      name : 'ups_shutdowncmd',
      placeholder : helptext.ups_shutdowncmd_placeholder,
      tooltip : helptext.ups_shutdowncmd_tooltip,
      required: true,
      validation : helptext.ups_shutdowncmd_validation
    },
    {
      type: 'input',
      inputType: 'number',
      name: 'ups_nocommwarntime',
      placeholder: helptext.ups_nocommwarntime_placeholder,
      tooltip: helptext.ups_nocommwarntime_tooltip,
      value: `300`,
    },
    {
      type : 'input',
      name : 'ups_monuser',
      placeholder : helptext.ups_monuser_placeholder,
      tooltip : helptext.ups_monuser_tooltip,
      required: true,
      validation : helptext.ups_monuser_validation
    },
    {
      type : 'input',
      name : 'ups_monpwd',
      inputType: 'password',
      togglePw: true,
      placeholder : helptext.ups_monpwd_placeholder,
      tooltip : helptext.ups_monpwd_tooltip,
      validation: helptext.ups_monpwd_validation
    },
    {
      type : 'textarea',
      name : 'ups_extrausers',
      placeholder : helptext.ups_extrausers_placeholder,
      tooltip : helptext.ups_extrausers_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ups_rmonitor',
      placeholder : helptext.ups_rmonitor_placeholder,
      tooltip : helptext.ups_rmonitor_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ups_emailnotify',
      placeholder : helptext.ups_emailnotify_placeholder,
      tooltip : helptext.ups_emailnotify_tooltip,
    },
    {
      type : 'input',
      name : 'ups_toemail',
      placeholder : helptext.ups_toemail_placeholder,
      tooltip : helptext.ups_toemail_tooltip,
    },
    {
      type : 'input',
      name : 'ups_subject',
      placeholder : helptext.ups_subject_placeholder,
      tooltip : helptext.ups_subject_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ups_powerdown',
      placeholder : helptext.ups_powerdown_placeholder,
      tooltip : helptext.ups_powerdown_tooltip
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    this.ups_driver = _.find(this.fieldConfig, { name: 'ups_driver' });
    this.ups_port = _.find(this.fieldConfig, { name: 'ups_port' });
    this.ups_driver_fg = entityForm.formGroup.controls['ups_driver'];

    this.ws.call('ups.driver_choices', []).subscribe((res) => {
      for (const item in res) {
        this.ups_driver.options.push({ label: res[item], value: item });
      }
    });

    this.ws.call('ups.port_choices', []).subscribe((res) => {
      for (let i=0; i < res.length; i++) {
        this.ups_port.options.push({label: res[i], value: res[i]});
      } 
    });
  }

}
