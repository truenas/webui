import { ApplicationRef, Component, Injector } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material';
import {
  regexValidator
} from '../../../common/entity/entity-form/validators/regex-validation';

import {
  IdmapService,
  IscsiService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { T } from '../../../../translate-marker';
import { Validators } from '@angular/forms';
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
      placeholder: T('NetBIOS Name'),
      tooltip: T('Automatically populated with the original hostname\
                  of the system. This name is limited to 15 characters and\
                  cannot be the <b>Workgroup</b> name.'),
      required: true,
      validation : [ Validators.required, Validators.maxLength(15) ]
    },
    {
      type: 'input',
      name: 'cifs_srv_netbiosalias',
      placeholder: T('NetBIOS Alias'),
      tooltip: T('Enter an alias. Limited to 15 characters.'),
      validation: [ Validators.maxLength(15) ]
    },
    {
      type: 'input',
      name: 'cifs_srv_workgroup',
      placeholder: T('Workgroup'),
      tooltip: T('Must match Windows workgroup\
                  name. This setting is ignored if the\
                  <a href="%%docurl%%/directoryservice.html%%webversion%%#active-directory"\
                  target="_blank">Active Directory</a> or <a\
                  href="%%docurl%%/directoryservice.html%%webversion%%#ldap"\
                  target="_blank">LDAP</a> service is running.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      name: 'cifs_srv_description',
      placeholder: T('Description'),
      tooltip: T('Optional. Enter a server description.'),
    },
    {
      type: 'select',
      name: 'cifs_srv_doscharset',
      placeholder: T('DOS Charset'),
      tooltip: T('The character set Samba uses when communicating with\
                  DOS and Windows 9x/ME clients. Default is CP437.'),
      options: [],
    },
    {
      type: 'select',
      name: 'cifs_srv_unixcharset',
      placeholder: T('UNIX Charset'),
      tooltip: T('Default is UTF-8 which supports all characters in\
                  all languages.'),
      options: [],
    },
    {
      type: 'select',
      name: 'cifs_srv_loglevel',
      placeholder: T('Log Level'),
      tooltip: T('Choices are <i>Minimum, Normal, or Debug</i>.'),
      options: [
        { label: 'None', value: 0 },
        { label: 'Minimum', value: 1 },
        { label: 'Normal', value: 2 },
        { label: 'Full', value: 3 },
        { label: 'Debug', value: 10 },
      ],
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_syslog',
      placeholder: T('Use syslog only'),
      tooltip: T('Set to log authentication failures in <i>/var/log/messages</i>\
                  instead of the default of <i>/var/log/samba4/log.smbd</i>.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_localmaster',
      placeholder: T('Local Master'),
      tooltip: T('Set to determine if the system participates in\
                  a browser election. Leave unset when the network contains an AD\
                  or LDAP server, or when Vista or Windows 7 machines\
                  are present.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_domain_logons',
      placeholder: T('Domain Logons'),
      tooltip: T('Set if it is necessary to provide the netlogin\
                  service for older Windows clients.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_timeserver',
      placeholder: T('Time Server For Domain'),
      tooltip: T(' Enable to determine if the system advertises\
                   itself as a time server to Windows clients.\
                   Disable when the network contains an AD or LDAP server.'),
    },
    {
      type: 'select',
      name: 'cifs_srv_guest',
      placeholder: T('Guest Account'),
      options: [],
      tooltip: T('Account to be used for guest access. Default is\
                  nobody. Account is required to have permissions to\
                  the shared pool or dataset.\
                  When the Guest Account user is deleted it resets to nobody.'),
    },
    { type: 'input',
      name: 'cifs_srv_filemask',
      placeholder: T('File Mask'),
      tooltip: T('Overrides default file creation mask of <i>0666</i> which\
                  creates files with read and write access for everybody.'),
      validation : [ regexValidator(/^[0-1]?[0-7][0-7][0-7]$/) ],
    },
    { type: 'input',
      name: 'cifs_srv_dirmask',
      placeholder: T('Directory Mask'),
      tooltip: T('Overrides default directory creation mask of <i>0777</i>\
                  which grants directory read, write and execute access\
                  for everybody.'),
      validation : [ regexValidator(/^[0-1]?[0-7][0-7][0-7]$/) ],
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_nullpw',
      placeholder: T('Allow Empty Password'),
      tooltip: T('If set, users can press <b>Enter</b>\
                  when prompted for a password. Requires the username\
                  and password to be the same as the Windows user account.'),
    },
    {
      type: 'textarea',
      name: 'cifs_srv_smb_options',
      placeholder: T('Auxiliary Parameters'),
      tooltip: T('Enter additional <b>smb.conf</b> options. See the <a href="http://www.oreilly.com/openbook/samba/book/appb_02.html"\
                  target="_blank">Samba Guide</a>\
                  for more information on these settings.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_unixext',
      placeholder: T('UNIX Extensions'),
      tooltip: T('Set to allow non-Windows SMB clients to access symbolic\
                  links and hard links. Has no effect on Windows clients.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_zeroconf',
      placeholder: T('Zeroconf share discovery'),
      tooltip: T('Enable if Mac clients will be connecting to the SMB share.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_hostlookup',
      placeholder: T('Hostnames Lookups'),
      tooltip: T('Set to allow using hostnames rather than IP addresses in\
                  the <i>Hosts Allow</b> or </i>Hosts Deny</b> fields\
                  of a SMB share. Leave this option\
                  unset when IP addresses are used to avoid the delay of a host lookup.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_allow_execute_always',
      placeholder: T('Allow Execute Always'),
      tooltip: T('When selected, Samba allows the user to execute\
                  a file, even if that user’s permissions are not set\
                  to execute.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_obey_pam_restrictions',
      placeholder: T('Obey Pam Restrictions'),
      tooltip: T('Unselect this option to allow cross-domain\
                  authentication, users and groups to be managed on\
                  another forest, and permissions to be delegated from\
                  <a href="%%docurl%%/directoryservice.html%%webversion%%#active-directory"\
                  target="_blank">Active Directory</a>\
                  users and groups to domain admins on another forest.'),
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_ntlmv1_auth',
      placeholder: T('NTLMv1 Auth'),
      tooltip: T('Off by default. When set,\
                  <a href="https://www.freebsd.org/cgi/man.cgi?query=smbd" target="_blank">smbd(8)</a>\
                  attempts to authenticate users with the insecure\
                  and vulnerable NTLMv1 encryption. This setting allows\
                  backward compatibility with older versions of Windows,\
                  but is not recommended and should not be used on\
                  untrusted networks.'),
    },
    {
      type: 'select',
      name: 'cifs_srv_bindip',
      placeholder: T('Bind IP Addresses'),
      tooltip: T('Select the IP addresses SMB will listen for.'),
      options: [],
      multiple: true
    },
    {
      type: 'input',
      name: 'idmap_tdb_range_low',
      placeholder: T('Range Low'),
      tooltip: T('The beginning UID/GID for which this system is\
                  authoritative. Any UID/GID lower than this value is ignored.\
                  This avoids accidental UID/GID overlaps between local and remotely\
                  defined IDs.'),
    },
    {
      type: 'input',
      name: 'idmap_tdb_range_high',
      placeholder: T('Range High'),
      tooltip: T('The ending UID/GID for which this system is authoritative.\
                  Any UID/GID higher than this value is ignored.\
                  This avoids accidental UID/GID overlaps between local\
                  and remotely defined IDs.'),
    }
  ];

  private cifs_srv_bindip: any;
  private cifs_srv_guest: any;
  private cifs_srv_doscharset: any;
  private cifs_srv_unixcharset: any;
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
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected iscsiService: IscsiService,
    protected idmapService: IdmapService,
    protected loader: AppLoaderService, protected dialog: MatDialog) {}

  afterInit(entityEdit: any) {
    this.rest.get('services/cifs', {}).subscribe((res) => {
      this.idmapID = res['id'];
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
