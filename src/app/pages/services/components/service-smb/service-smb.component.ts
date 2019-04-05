import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { MatDialog, MatDialogRef } from '@angular/material';

import { IdmapService, IscsiService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import helptext from '../../../../helptext/services/components/service-smb';

@Component({
  selector: 'smb-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
  providers: [IscsiService, IdmapService],
})

export class ServiceSMBComponent {

  protected resource_name: string = 'services/cifs';
  protected route_success: string[] = ['services'];
  public formGroup: any;
  public error: string;
  protected idmapID: any;
  protected query_call = "directoryservice.idmap_";
  protected idmap_type = 'tdb'
  protected targetDS = '5';


  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'cifs_srv_netbiosname',
      placeholder: helptext.cifs_srv_netbiosname_placeholder,
      tooltip: helptext.cifs_srv_netbiosname_tooltip,
      required: true,
      validation : helptext.cifs_srv_netbiosname_validation
    },
    {
      type: 'input',
      name: 'cifs_srv_netbiosalias',
      placeholder: helptext.cifs_srv_netbiosalias_placeholder,
      tooltip: helptext.cifs_srv_netbiosalias_tooltip,
      validation: helptext.cifs_srv_netbiosalias_validation
    },
    {
      type: 'input',
      name: 'cifs_srv_workgroup',
      placeholder: helptext.cifs_srv_workgroup_placeholder,
      tooltip: helptext.cifs_srv_workgroup_tooltip,
      required: true,
      validation : helptext.cifs_srv_workgroup_validation
    },
    {
      type: 'input',
      name: 'cifs_srv_description',
      placeholder: helptext.cifs_srv_description_placeholder,
      tooltip: helptext.cifs_srv_description_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_enable_smb1',
      placeholder: helptext.cifs_srv_enable_smb1_placeholder,
      tooltip: helptext.cifs_srv_enable_smb1_tooltip,
    },
    {
      type: 'select',
      name: 'cifs_srv_doscharset',
      placeholder: helptext.cifs_srv_doscharset_placeholder,
      tooltip: helptext.cifs_srv_doscharset_tooltip,
      options: [],
    },
    {
      type: 'select',
      name: 'cifs_srv_unixcharset',
      placeholder: helptext.cifs_srv_unixcharset_placeholder,
      tooltip: helptext.cifs_srv_unixcharset_tooltip,
      options: [],
    },
    {
      type: 'select',
      name: 'cifs_srv_loglevel',
      placeholder: helptext.cifs_srv_loglevel_placeholder,
      tooltip: helptext.cifs_srv_loglevel_tooltip,
      options: helptext.cifs_srv_loglevel_options,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_syslog',
      placeholder: helptext.cifs_srv_syslog_placeholder,
      tooltip: helptext.cifs_srv_syslog_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_localmaster',
      placeholder: helptext.cifs_srv_localmaster_placeholder,
      tooltip: helptext.cifs_srv_localmaster_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_domain_logons',
      placeholder: helptext.cifs_srv_domain_logons_placeholder,
      tooltip: helptext.cifs_srv_domain_logons_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_timeserver',
      placeholder: helptext.cifs_srv_timeserver_placeholder,
      tooltip: helptext.cifs_srv_timeserver_tooltip,
    },
    {
      type: 'select',
      name: 'cifs_srv_guest',
      placeholder: helptext.cifs_srv_guest_placeholder,
      options: [],
      tooltip: helptext.cifs_srv_guest_tooltip,
    },
    { 
      type: 'select',
      name: 'cifs_srv_admin_group',
      placeholder: helptext.cifs_srv_admin_group_placeholder,
      tooltip: helptext.cifs_srv_admin_group_tooltip,
      options: [{
          label: '------',
          value: '',
      }],
    },
    { type: 'input',
      name: 'cifs_srv_filemask',
      placeholder: helptext.cifs_srv_filemask_placeholder,
      tooltip: helptext.cifs_srv_filemask_tooltip,
      validation : helptext.cifs_srv_filemask_validation
    },
    { type: 'input',
      name: 'cifs_srv_dirmask',
      placeholder: helptext.cifs_srv_dirmask_placeholder,
      tooltip: helptext.cifs_srv_dirmask_tooltip,
      validation : helptext.cifs_srv_dirmask_validation
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_nullpw',
      placeholder: helptext.cifs_srv_nullpw_placeholder,
      tooltip: helptext.cifs_srv_nullpw_tooltip,
    },
    {
      type: 'textarea',
      name: 'cifs_srv_smb_options',
      placeholder: helptext.cifs_srv_smb_options_placeholder,
      tooltip: helptext.cifs_srv_smb_options_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_unixext',
      placeholder: helptext.cifs_srv_unixext_placeholder,
      tooltip: helptext.cifs_srv_unixext_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_zeroconf',
      placeholder: helptext.cifs_srv_zeroconf_placeholder,
      tooltip: helptext.cifs_srv_zeroconf_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_hostlookup',
      placeholder: helptext.cifs_srv_hostlookup_placeholder,
      tooltip: helptext.cifs_srv_hostlookup_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_allow_execute_always',
      placeholder: helptext.cifs_srv_allow_execute_always_placeholder,
      tooltip: helptext.cifs_srv_allow_execute_always_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_obey_pam_restrictions',
      placeholder: helptext.cifs_srv_obey_pam_restrictions_placeholder,
      tooltip: helptext.cifs_srv_obey_pam_restrictions_tooltip,
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_ntlmv1_auth',
      placeholder: helptext.cifs_srv_ntlmv1_auth_placeholder,
      tooltip: helptext.cifs_srv_ntlmv1_auth_tooltip,
    },
    {
      type: 'select',
      name: 'cifs_srv_bindip',
      placeholder: helptext.cifs_srv_bindip_placeholder,
      tooltip: helptext.cifs_srv_bindip_tooltip,
      options: [],
      multiple: true
    },
    {
      type: 'input',
      name: 'idmap_tdb_range_low',
      placeholder: helptext .idmap_tdb_range_low_placeholder,
      tooltip: helptext.idmap_tdb_range_low_tooltip,
    },
    {
      type: 'input',
      name: 'idmap_tdb_range_high',
      placeholder: helptext.idmap_tdb_range_high_placeholder,
      tooltip: helptext.idmap_tdb_range_high_tooltip,
    }
  ];

  private cifs_srv_bindip: any;
  private cifs_srv_guest: any;
  private cifs_srv_doscharset: any;
  private cifs_srv_unixcharset: any;
  private cifs_srv_admin_group: any;
  protected defaultIdmap: any;
  protected idmap_tdb_range_low: any;
  protected idmap_tdb_range_high: any;
  protected dialogRef: any;

  preInit(entityForm: any) {
    this.cifs_srv_doscharset = _.find(this.fieldConfig, {"name": "cifs_srv_doscharset"});
    this.cifs_srv_unixcharset = _.find(this.fieldConfig, {"name": "cifs_srv_unixcharset"});
    this.ws.call("smb.doscharset_choices").subscribe((res) => {
      const values = Object.values(res);
      for (let i = 0; i < values.length; i++) {
        this.cifs_srv_doscharset.options.push({label: values[i], value: values[i]});
      }
    });
    this.ws.call("smb.unixcharset_choices").subscribe((res) => {
      const values = Object.values(res);
      for (let i = 0; i < values.length; i++) {
        this.cifs_srv_unixcharset.options.push({label: values[i], value: values[i]});
      }
    });
    this.iscsiService.getIpChoices().subscribe((res) => {
      this.cifs_srv_bindip =
        _.find(this.fieldConfig, { 'name': 'cifs_srv_bindip' });
      res.forEach((item) => {
        this.cifs_srv_bindip.options.push({ label: item[0], value: item[0] });
      })
    });
    this.ws.call('user.query').subscribe((res) => {
      this.cifs_srv_guest = _.find(this.fieldConfig, {'name':'cifs_srv_guest'});
      res.forEach((user) => {
        this.cifs_srv_guest.options.push({ label: user.username, value: user.username });
      });
    });
    this.ws.call('group.query').subscribe((res) => {
      this.cifs_srv_admin_group = _.find(this.fieldConfig, {'name':'cifs_srv_admin_group'});
      res.forEach((group) => {
        this.cifs_srv_admin_group.options.push({ label: group.group, value: group.group });
      });
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected iscsiService: IscsiService,
    protected idmapService: IdmapService,
    protected loader: AppLoaderService, protected dialog: MatDialog) {}

  afterInit(entityEdit: any) {
    this.rest.get('services/cifs', {}).subscribe((res) => {
      this.idmapID = res.id;
      this.ws.call('datastore.query', ['directoryservice.idmap_tdb', [["idmap_ds_type", "=", "5"], ["idmap_ds_id", "=", res.data['id']]]]).subscribe((idmap_res) => {
        this.defaultIdmap = idmap_res[0];
        entityEdit.formGroup.controls['idmap_tdb_range_high'].setValue(idmap_res[0].idmap_tdb_range_high);
        entityEdit.formGroup.controls['idmap_tdb_range_low'].setValue(idmap_res[0].idmap_tdb_range_low);
      });
    });
  }

  beforeSubmit(entityEdit: any) {
    this.error = null;

    let value = _.cloneDeep(entityEdit);
    let new_range_low: any;
    let new_range_high: any;

    for (let i in value) {
      if (_.endsWith(i, 'range_low')) {
        new_range_low = value[i];
      }
      if (_.endsWith(i, 'range_high')) {
        new_range_high = value[i];
      }
    }
      this.ws.call('datastore.query', [this.query_call + this.idmap_type, [["idmap_ds_type", "=", this.targetDS]]]).subscribe((res) => {
        if (res[0]) {
          this.idmapID = res[0].id;
        if (new_range_low > new_range_high) {
          this.error = "Range low is greater than range high.";
        } else {
          if (this.idmapID) {
            this.ws.call(
              'datastore.update', [this.query_call + this.idmap_type, this.idmapID, value]).subscribe(res=>{
            });
          };
        };
      }});
    }
  }
