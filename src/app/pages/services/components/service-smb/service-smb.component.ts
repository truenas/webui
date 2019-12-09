import { ApplicationRef, Component, Injector } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { greaterThan } from "app/pages/common/entity/entity-form/validators/compare-validation";
import { T } from 'app/translate-marker';
import * as _ from 'lodash';
import helptext from '../../../../helptext/services/components/service-smb';
import { IdmapService, RestService, ServicesService, UserService, WebSocketService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'smb-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
  providers: [ServicesService, IdmapService],
})

export class ServiceSMBComponent {

  protected queryCall = 'smb.config';
  protected route_success: string[] = ['services'];
  public formGroup: any;
  public error: string;
  protected query_call = "directoryservice.idmap_";
  protected idmap_type = 'tdb'
  protected targetDS = '5';
  protected isBasicMode = true;

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

  protected advanced_field = [
    'idmap_tdb_range_low',
    'idmap_tdb_range_high',
    'unixcharset',
    'loglevel',
    'syslog',
    'localmaster',
    'guest',
    'admin_group',
    'zeroconf',
    'bindip',
    'smb_options'
  ];
  protected hiddenFieldSets = [helptext.cifs_srv_fieldset_idmap, helptext.cifs_srv_fieldset_other];

  public fieldSets: FieldSet[] = [
    {
      name: helptext.cifs_srv_fieldset_netbios,
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'netbiosname',
          placeholder: helptext.cifs_srv_netbiosname_placeholder,
          tooltip: helptext.cifs_srv_netbiosname_tooltip,
          required: true,
          validation : helptext.cifs_srv_netbiosname_validation
        },
        {
          type : 'input',
          name : 'netbiosname_b',
          placeholder : helptext.cifs_srv_netbiosname_b_placeholder,
          tooltip : helptext.cifs_srv_netbiosname_b_tooltip,
          validation : helptext.cifs_srv_netbiosname_b_validation,
          required : true,
          isHidden: true,
          disabled: true
        },
        {
          type: 'input',
          name: 'netbiosalias',
          placeholder: helptext.cifs_srv_netbiosalias_placeholder,
          tooltip: helptext.cifs_srv_netbiosalias_tooltip,
          validation: helptext.cifs_srv_netbiosalias_validation
        },
        {
          type: 'input',
          name: 'workgroup',
          placeholder: helptext.cifs_srv_workgroup_placeholder,
          tooltip: helptext.cifs_srv_workgroup_tooltip,
          required: true,
          validation : helptext.cifs_srv_workgroup_validation
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.cifs_srv_description_placeholder,
          tooltip: helptext.cifs_srv_description_tooltip,
        },
        {
          type: 'checkbox',
          name: 'enable_smb1',
          placeholder: helptext.cifs_srv_enable_smb1_placeholder,
          tooltip: helptext.cifs_srv_enable_smb1_tooltip,
        },
        {
          type: 'checkbox',
          name: 'ntlmv1_auth',
          placeholder: helptext.cifs_srv_ntlmv1_auth_placeholder,
          tooltip: helptext.cifs_srv_ntlmv1_auth_tooltip,
        }
      ]
    },
    {
      name: helptext.cifs_srv_fieldset_idmap,
      label: false,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'idmap_tdb_range_low',
          inputType: 'number',
          placeholder: helptext.idmap_tdb_range_low_placeholder,
          tooltip: helptext.idmap_tdb_range_low_tooltip,
        },
        {
          type: 'input',
          name: 'idmap_tdb_range_high',
          inputType: 'number',
          placeholder: helptext.idmap_tdb_range_high_placeholder,
          tooltip: helptext.idmap_tdb_range_high_tooltip,
          validation: [greaterThan('idmap_tdb_range_low', [helptext.idmap_tdb_range_low_placeholder]), regexValidator(/^\d+$/)],
        }
      ]
    },
    { name: 'divider', divider: false },
    {
      name: helptext.cifs_srv_fieldset_other,
      label: false,
      config: [
        {
          type: 'select',
          name: 'unixcharset',
          placeholder: helptext.cifs_srv_unixcharset_placeholder,
          tooltip: helptext.cifs_srv_unixcharset_tooltip,
          options: [],
        },
        {
          type: 'select',
          name: 'loglevel',
          placeholder: helptext.cifs_srv_loglevel_placeholder,
          tooltip: helptext.cifs_srv_loglevel_tooltip,
          options: helptext.cifs_srv_loglevel_options,
        },
        {
          type: 'checkbox',
          name: 'syslog',
          placeholder: helptext.cifs_srv_syslog_placeholder,
          tooltip: helptext.cifs_srv_syslog_tooltip,
        },
        {
          type: 'checkbox',
          name: 'localmaster',
          placeholder: helptext.cifs_srv_localmaster_placeholder,
          tooltip: helptext.cifs_srv_localmaster_tooltip,
        },
        {
          type: 'select',
          name: 'guest',
          placeholder: helptext.cifs_srv_guest_placeholder,
          options: [],
          tooltip: helptext.cifs_srv_guest_tooltip,
        },
        { 
          type: 'combobox',
          name: 'admin_group',
          placeholder: helptext.cifs_srv_admin_group_placeholder,
          tooltip: helptext.cifs_srv_admin_group_tooltip,
          options: [],
          searchOptions: [],
          parent: this,
          updater: this.updateGroupSearchOptions
        },
        {
          type: 'checkbox',
          name: 'zeroconf',
          placeholder: helptext.cifs_srv_zeroconf_placeholder,
          tooltip: helptext.cifs_srv_zeroconf_tooltip,
        },
        {
          type: 'select',
          name: 'bindip',
          placeholder: helptext.cifs_srv_bindip_placeholder,
          tooltip: helptext.cifs_srv_bindip_tooltip,
          options: [],
          multiple: true
        },
        {
          type: 'textarea',
          name: 'smb_options',
          placeholder: helptext.cifs_srv_smb_options_placeholder,
          tooltip: helptext.cifs_srv_smb_options_tooltip,
        }
      ]
    },
    { name: 'divider', divider: true }
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : T('Basic Mode'),
      function : () => {
        this.hiddenFieldSets.forEach(setId => (this.fieldSets.find(set => set.name === setId).label = false));
        this.fieldSets.filter(set => set.name === 'divider')[0].divider = false;
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      'id' : 'advanced_mode',
      name : T('Advanced Mode'),
      function : () => {
        this.hiddenFieldSets.forEach(setId => (this.fieldSets.find(set => set.name === setId).label = true));
        this.fieldSets.filter(set => set.name === 'divider').forEach(set => set.divider = true);
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

  preInit(entityForm: any) {
    if (window.localStorage.getItem('is_freenas') === 'false') {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        entityForm.setDisabled('netbiosname_b', !is_ha, !is_ha);
      });
    }

    const otherSet = _.find(this.fieldSets, {"name": helptext.cifs_srv_fieldset_other})

    this.cifs_srv_unixcharset = otherSet.config.find(config => config.name === "unixcharset");
    this.ws.call("smb.unixcharset_choices").subscribe((res) => {
      const values = Object.values(res);
      for (let i = 0; i < values.length; i++) {
        this.cifs_srv_unixcharset.options.push({label: values[i], value: values[i]});
      }
    });

    this.servicesService.getSmbBindIPChoices().subscribe((res) => {
      this.cifs_srv_bindip = otherSet.config.find(config => config.name === "bindip");
        for (let key in res) {
          if (res.hasOwnProperty(key)) {
              this.cifs_srv_bindip.options.push({ label: res[key], value: res[key] });
          }
      }
    });
  
    this.ws.call('user.query').subscribe((res) => {
      this.cifs_srv_guest = otherSet.config.find(config => config.name === "guest");
      res.forEach((user) => {
        this.cifs_srv_guest.options.push({ label: user.username, value: user.username });
      });
    });

    this.userService.groupQueryDSCache().subscribe(items => {
      const groups = [];
      items.forEach((item) => {
        groups.push({label: item.group, value: item.group});
      });
      this.cifs_srv_admin_group = otherSet.config.find(config => config.name === 'admin_group');
      groups.forEach((group) => {
        this.cifs_srv_admin_group.options.push({ label: group.label, value: group.value });
      });
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected servicesService: ServicesService,
    protected idmapService: IdmapService, protected userService: UserService,
    protected loader: AppLoaderService, protected dialog: MatDialog) {}

  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => {
      delete body.idmap_tdb_range_high;
      delete body.idmap_tdb_range_low;
      return this.ws.call('smb.update', [body])
    };

    this.entityEdit = entityEdit;
    this.ws.call('idmap.get_or_create_idmap_by_domain', ['DS_TYPE_DEFAULT_DOMAIN']).subscribe((idmap_res) => {
      this.defaultIdmap = idmap_res[0]; // never used and undefined anyway
      this.idNumber = idmap_res.id;
      entityEdit.formGroup.controls['idmap_tdb_range_high'].setValue(idmap_res.range_high);
      entityEdit.formGroup.controls['idmap_tdb_range_low'].setValue(idmap_res.range_low);
    });
  }

  updateGroupSearchOptions(value = "", parent) {
    parent.userService.groupQueryDSCache(value).subscribe(items => {
      const groups = [];
      for (let i = 0; i < items.length; i++) {
        groups.push({label: items[i].group, value: items[i].group});
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
