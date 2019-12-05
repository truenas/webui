import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import globalHelptext from 'app/helptext/global-helptext';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../helptext/services/components/service-ssh';
import { NetworkService, RestService, WebSocketService } from '../../../../services/';

@Component({
  selector : 'ssh-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
  providers : [ NetworkService ],
})
export class ServiceSSHComponent implements OnInit {
  // Form Layout
  protected isBasicMode: boolean = true;
  protected queryCall = 'ssh.config';
  protected route_success: string[] = [ 'services' ];

  public fieldSets: FieldSet[] = [
    {
      name: globalHelptext.fieldset_general_options,
      label: true,
      width: '50%',
      config: [
        {
          type : 'input',
          name : 'tcpport',
          placeholder : helptext.ssh_tcpport_placeholder,
          tooltip: helptext.ssh_tcpport_tooltip,
        },
        {
          type : 'checkbox',
          name : 'rootlogin',
          placeholder : helptext.ssh_rootlogin_placeholder,
          tooltip: helptext.ssh_rootlogin_tooltip,
        },
        {
          type : 'checkbox',
          name : 'passwordauth',
          placeholder : helptext.ssh_passwordauth_placeholder,
          tooltip: helptext.ssh_passwordauth_tooltip,
        },
        {
          type : 'checkbox',
          name : 'kerberosauth',
          placeholder : helptext.ssh_kerberosauth_placeholder,
          tooltip: helptext.ssh_kerberosauth_tooltip,
        },
        {
          type : 'checkbox',
          name : 'tcpfwd',
          placeholder : helptext.ssh_tcpfwd_placeholder,
          tooltip: helptext.ssh_tcpfwd_tooltip,
        }
      ]
    },
    {
      name: globalHelptext.fieldset_other_options,
      label: false,
      width: '50%',
      config: [
        {
          type : 'select',
          name : 'bindiface',
          placeholder : helptext.ssh_bindiface_placeholder,
          tooltip: helptext.ssh_bindiface_tooltip,
          multiple : true,
          options : []
        },
        {
          type : 'checkbox',
          name : 'compression',
          placeholder : helptext.ssh_compression_placeholder,
          tooltip: helptext.ssh_compression_tooltip,
        },
        {
          type : 'select',
          name : 'sftp_log_level',
          placeholder : helptext.ssh_sftp_log_level_placeholder,
          tooltip: helptext.ssh_sftp_log_level_tooltip,
          options : helptext.ssh_sftp_log_level_options,
        },
        {
          type : 'select',
          name : 'sftp_log_facility',
          placeholder : helptext.ssh_sftp_log_facility_placeholder,
          tooltip: helptext.ssh_sftp_log_facility_tooltip,
          options : helptext.ssh_sftp_log_facility_options,
        },
        {
          type : 'textarea',
          name : 'options',
          placeholder : helptext.ssh_options_placeholder,
          tooltip: helptext.ssh_options_tooltip,
        }
      ]
    },
    { name: 'divider', divider: true }
  ];
  
  protected advanced_field: Array<string> = [
    'bindiface',
    'compression',
    'sftp_log_level',
    'sftp_log_facility',
    'options',
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => {
        this.fieldSets.find(set => set.name === globalHelptext.fieldset_other_options).label = false;
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      'id' : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => {
        this.fieldSets.find(set => set.name === globalHelptext.fieldset_other_options).label = true;
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];

  protected ssh_bindiface: any;

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef,
      protected networkService: NetworkService,
  ) {}

  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => this.ws.call('ssh.update', [body]);
  }

  ngOnInit() {
    this.ws.call('ssh.bindiface_choices').subscribe((res) => {
      this.ssh_bindiface = this.fieldSets
          .find(set => set.name === globalHelptext.fieldset_other_options)
          .config.find(config => config.name === 'bindiface');
      for (const k in res) {
        this.ssh_bindiface.options.push({label : res[k], value : k});
      }
    });
  }
}
