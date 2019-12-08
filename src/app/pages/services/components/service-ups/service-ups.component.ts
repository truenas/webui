import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../helptext/services/components/service-ups';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector : 'ups-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})
export class ServiceUPSComponent {
  protected ups_driver: any;
  private ups_drivers_list: any;
  private ups_driver_key: any;
  protected ups_port: any;
  protected entityForm: any;

  protected queryCall = 'ups.config';
  protected route_success: string[] = [ 'services' ];

  public fieldSets: FieldSet[] = [
    {
      name: helptext.ups_fieldset_general,
      label: true,
      width: '50%',
      config: [
        {
          type : 'input',
          name : 'identifier',
          placeholder : helptext.ups_identifier_placeholder,
          tooltip : helptext.ups_identifier_tooltip,
          required: true,
          validation : helptext.ups_identifier_validation
        },
        {
          type : 'select',
          name : 'mode',
          placeholder : helptext.ups_mode_placeholder,
          tooltip : helptext.ups_mode_tooltip,
          options : helptext.ups_mode_options
        },
        {
          type : 'input',
          name : 'remotehost',
          placeholder : helptext.ups_remotehost_placeholder,
          tooltip : helptext.ups_remotehost_tooltip,
          required: true,
          isHidden: true,
          validation : helptext.ups_remotehost_validation
        },
        {
          type : 'input',
          name : 'remoteport',
          placeholder : helptext.ups_remoteport_placeholder,
          tooltip : helptext.ups_remoteport_tooltip,
          value : helptext.ups_remoteport_value,
          required: true,
          isHidden: true,
          validation : helptext.ups_remoteport_validation
        },
        {
          type : 'combobox',
          name : 'driver',
          placeholder : helptext.ups_driver_placeholder,
          tooltip : helptext.ups_driver_tooltip,
          required: true,
          options: [],
          validation : helptext.ups_driver_validation,
          isHidden: false
        },
        {
          type : 'combobox',
          name : 'port',
          placeholder : helptext.ups_port_placeholder,
          options: [],
          tooltip : helptext.ups_port_tooltip,
          required: true,
          validation : helptext.ups_port_validation,
          isHidden: false
        }
      ]
    },
    {
      name: helptext.ups_fieldset_monitor,
      label: true,
      width: '50%',
      config: [
        {
          type : 'input',
          name : 'monuser',
          placeholder : helptext.ups_monuser_placeholder,
          tooltip : helptext.ups_monuser_tooltip,
          required: true,
          validation : helptext.ups_monuser_validation
        },
        {
          type : 'input',
          name : 'monpwd',
          inputType: 'password',
          togglePw: true,
          placeholder : helptext.ups_monpwd_placeholder,
          tooltip : helptext.ups_monpwd_tooltip,
          validation: helptext.ups_monpwd_validation
        },
        {
          type : 'textarea',
          name : 'extrausers',
          placeholder : helptext.ups_extrausers_placeholder,
          tooltip : helptext.ups_extrausers_tooltip,
        },
        {
          type : 'checkbox',
          name : 'rmonitor',
          placeholder : helptext.ups_rmonitor_placeholder,
          tooltip : helptext.ups_rmonitor_tooltip,
        }
      ]
    },
    { name: 'divier', divider: true },
    {
      name: helptext.ups_fieldset_shutdown,
      label: true,
      width: '50%',
      config: [
        {
          type : 'select',
          name : 'shutdown',
          placeholder : helptext.ups_shutdown_placeholder,
          tooltip : helptext.ups_shutdown_tooltip,
          options : helptext.ups_shutdown_options
        },
        {
          type : 'input',
          inputType: 'number',
          name : 'shutdowntimer',
          placeholder : helptext.ups_shutdowntimer_placeholder,
          tooltip : helptext.ups_shutdowntimer_tooltip,
        },
        {
          type : 'input',
          name : 'shutdowncmd',
          placeholder : helptext.ups_shutdowncmd_placeholder,
          tooltip : helptext.ups_shutdowncmd_tooltip,
        },
        {
          type : 'checkbox',
          name : 'powerdown',
          placeholder : helptext.ups_powerdown_placeholder,
          tooltip : helptext.ups_powerdown_tooltip
        }
      ]
    },
    {
      name: helptext.ups_fieldset_email,
      label: true,
      width: '50%',
      config: [
        {
          type : 'checkbox',
          name : 'emailnotify',
          placeholder : helptext.ups_emailnotify_placeholder,
          tooltip : helptext.ups_emailnotify_tooltip,
        },
        {
          type : 'input',
          name : 'toemail',
          placeholder : helptext.ups_toemail_placeholder,
          tooltip : helptext.ups_toemail_tooltip,
        },
        {
          type : 'input',
          name : 'subject',
          placeholder : helptext.ups_subject_placeholder,
          tooltip : helptext.ups_subject_tooltip,
        }
      ]
    },
    { name: 'divier', divider: true },
    {
      name: helptext.ups_fieldset_other,
      label: true,
      config: [
        {
          type: 'input',
          inputType: 'number',
          name: 'nocommwarntime',
          placeholder: helptext.ups_nocommwarntime_placeholder,
          tooltip: helptext.ups_nocommwarntime_tooltip,
          value: `300`,
        },
        {
          type : 'input',
          inputType: 'number',
          name : 'hostsync',
          placeholder : helptext.ups_hostsync_placeholder,
          tooltip : helptext.ups_hostsync_tooltip,
          value: 15,
        },
        {
          type : 'input',
          name : 'description',
          placeholder : helptext.ups_description_placeholder,
          tooltip : helptext.ups_description_tooltip,
        },
        {
          type : 'textarea',
          name : 'options',
          placeholder : helptext.ups_options_placeholder,
          tooltip : helptext.ups_options_tooltip,
          isHidden: false
        },
        {
          type : 'textarea',
          name : 'optionsupsd',
          placeholder : helptext.ups_optionsupsd_placeholder,
          tooltip : helptext.ups_optionsupsd_tooltip,
        }
      ]
    },
    { name: 'divider', divider: true },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityForm: EntityFormComponent) {
    entityForm.submitFunction = body => this.ws.call('ups.update', [body]);
    this.entityForm = entityForm;

    const generalSet = this.fieldSets.find(set => set.name === helptext.ups_fieldset_general);
    this.ups_driver = generalSet.config.find(config => config.name === 'driver');
    this.ups_port = generalSet.config.find(config => config.name === 'port')

    this.ws.call('ups.driver_choices', []).subscribe((res) => {
      this.ups_drivers_list = res;
      for (const item in res) {
        this.ups_driver.options.push({ label: res[item], value: res[item] });
      }
    });

    this.ws.call('ups.port_choices', []).subscribe((res) => {
      for (let i=0; i < res.length; i++) {
        this.ups_port.options.push({label: res[i], value: res[i]});
      } 
    });

    entityForm.formGroup.controls['driver'].valueChanges.subscribe((res) => {;
      this.ups_driver_key = this.getKeyByValue(this.ups_drivers_list, res);
      if (this.ups_drivers_list[res]) {
        entityForm.formGroup.controls['driver'].setValue(this.ups_drivers_list[res]);
      }
    });

    entityForm.formGroup.controls['mode'].valueChanges.subscribe((res) => {
        generalSet.config.find(conf => conf.name === 'remotehost').isHidden = res === 'master';
        generalSet.config.find(conf => conf.name === 'remoteport').isHidden = res === 'master';
    });
  }

  getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

  beforeSubmit(data: any) {
    data.ups_driver = this.ups_driver_key;
  }

}
