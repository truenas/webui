import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material';

import { IdmapService, IscsiService, RestService, WebSocketService, UserService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityUtils } from '../../../common/entity/utils';
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
      type: 'select',
      name: 'cifs_srv_guest',
      placeholder: helptext.cifs_srv_guest_placeholder,
      options: [],
      tooltip: helptext.cifs_srv_guest_tooltip,
    },
    { 
      type: 'combobox',
      name: 'cifs_srv_admin_group',
      placeholder: helptext.cifs_srv_admin_group_placeholder,
      tooltip: helptext.cifs_srv_admin_group_tooltip,
      options: [],
      searchOptions: [],
      parent: this,
      updater: this.updateGroupSearchOptions
    },
    {
      type: 'textarea',
      name: 'cifs_srv_smb_options',
      placeholder: helptext.cifs_srv_smb_options_placeholder,
      tooltip: helptext.cifs_srv_smb_options_tooltip,
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
      inputType: 'number',
      placeholder: helptext .idmap_tdb_range_low_placeholder,
      tooltip: helptext.idmap_tdb_range_low_tooltip,
    },
    {
      type: 'input',
      name: 'idmap_tdb_range_high',
      inputType: 'number',
      placeholder: helptext.idmap_tdb_range_high_placeholder,
      tooltip: helptext.idmap_tdb_range_high_tooltip,
      validation: helptext.idmap_tdb_range_high_validation
    }
  ];

  private cifs_srv_bindip: any;
  private cifs_srv_guest: any;
  private cifs_srv_unixcharset: any;
  private cifs_srv_admin_group: any;
  protected defaultIdmap: any;
  protected idmap_tdb_range_low: any;
  protected idmap_tdb_range_high: any;
  protected dialogRef: any;
  protected idNumber: any;
  public entityEdit: any;

  preInit(entityForm: any) {
    this.cifs_srv_unixcharset = _.find(this.fieldConfig, {"name": "cifs_srv_unixcharset"});
    this.ws.call("smb.unixcharset_choices").subscribe((res) => {
      const values = Object.values(res);
      for (let i = 0; i < values.length; i++) {
        this.cifs_srv_unixcharset.options.push({label: values[i], value: values[i]});
      }
    });
    this.iscsiService.getIpChoices().subscribe((res) => {
      this.cifs_srv_bindip =
        _.find(this.fieldConfig, { 'name': 'cifs_srv_bindip' });
        for (let key in res) {
          if (res.hasOwnProperty(key)) {
              this.cifs_srv_bindip.options.push({ label: res[key], value: res[key] });
          }
      }
      // res.forEach((item) => {
      //   this.cifs_srv_bindip.options.push({ label: item[0], value: item[0] });
      // })
    });
    this.ws.call('user.query').subscribe((res) => {
      this.cifs_srv_guest = _.find(this.fieldConfig, {'name':'cifs_srv_guest'});
      res.forEach((user) => {
        this.cifs_srv_guest.options.push({ label: user.username, value: user.username });
      });
    });
    this.userService.listAllGroups().subscribe(res => {
      let groups = [];
      let items = res.data.items;
      items.forEach((item) => {
        groups.push({label: item.label, value: item.id});
      });
      this.cifs_srv_admin_group = _.find(this.fieldConfig, {'name':'cifs_srv_admin_group'});
      groups.forEach((group) => {
        this.cifs_srv_admin_group.options.push({ label: group.label, value: group.value });
      });
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected iscsiService: IscsiService,
    protected idmapService: IdmapService, protected userService: UserService,
    protected loader: AppLoaderService, protected dialog: MatDialog) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
    this.rest.get('services/cifs', {}).subscribe((res) => {
      this.idmapID = res['id'];
      this.ws.call('idmap.get_or_create_idmap_by_domain', ['DS_TYPE_DEFAULT_DOMAIN']).subscribe((idmap_res) => {
        this.defaultIdmap = idmap_res[0]; // never used and undefined anyway
        this.idNumber = idmap_res.id;
        entityEdit.formGroup.controls['idmap_tdb_range_high'].setValue(idmap_res.range_high);
        entityEdit.formGroup.controls['idmap_tdb_range_low'].setValue(idmap_res.range_low);


      });
    });
  }

  updateGroupSearchOptions(value = "", parent) {
    parent.userService.listAllGroups(value).subscribe(res => {
      let groups = [];
      let items = res.data.items;
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].label, value: items[i].id});
      }
        parent.cifs_srv_admin_group.searchOptions = groups;
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

    // Puts validation errors on screen but doesn't stop form from submitting
    //beforeSubmit doesn't block submit from happening even with an error
    this.ws.call('idmap.tdb.update', [this.idNumber, {range_low: new_range_low, range_high: new_range_high}])
      .subscribe(() => {},
      (err)=>{
        new EntityUtils().handleWSError(this.entityEdit, err);
      },
      () => {})
    }
  }
