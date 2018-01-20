import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { FormControl, NG_VALIDATORS } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import {
  IdmapService,
  IscsiService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'smb-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
  providers: [IscsiService, IdmapService],
})

export class ServiceSMBComponent implements OnInit {

  protected resource_name: string = 'services/cifs';
  protected route_success: string[] = ['services'];
  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'cifs_srv_netbiosname',
      placeholder: 'NetBIOS Name',
      tooltip: 'Automatically populated with the original hostname\
 of the system; limited to 15 characters; it must be\
 different from the Workgroup name.',
    },
    {
      type: 'input',
      name: 'cifs_srv_netbiosalias',
      placeholder: 'NetBIOS Alias',
      tooltip: 'Limited to 15 characters.',
    },
    {
      type: 'input',
      name: 'cifs_srv_workgroup',
      placeholder: 'Workgroup',
      tooltip: 'Must match Windows workgroup\
 name; this setting is ignored if the <a href="http://doc.freenas.org/11/directoryservice.html#active-directory" target="_blank">Active Directory</a>\
 or <a href="http://doc.freenas.org/11/directoryservice.html#ldap" target="_blank">LDAP</a>\
 service is running.',
    },
    {
      type: 'input',
      name: 'cifs_srv_description',
      placeholder: 'Description',
      tooltip: 'Enter server description; this field is optional.',
    },
    {
      type: 'select',
      name: 'cifs_srv_doscharset',
      placeholder: 'DOS Charset',
      tooltip: 'The character set Samba uses when communicating with\
   DOS and Windows 9x/ME clients; default is CP437.',
      options: [
        { label: 'CP437', value: 'CP437' },
        { label: 'CP850', value: 'CP850' },
        { label: 'CP852', value: 'CP852' },
        { label: 'CP866', value: 'CP866' },
        { label: 'CP932', value: 'CP932' },
        { label: 'CP949', value: 'CP949' },
        { label: 'CP950', value: 'CP950' },
        { label: 'CP1026', value: 'CP1026' },
        { label: 'CP1251', value: 'CP1251' },
        { label: 'ASCII', value: 'ASCII' },
      ],
    },
    {
      type: 'select',
      name: 'cifs_srv_unixcharset',
      placeholder: 'UNIX Charset',
      tooltip: 'Default is UTF-8 which supports all characters in\
   all languages.',
      options: [
        { label: 'UTF-8', value: 'UTF-8' },
        { label: 'iso-8859-1', value: 'ISO-8859-1' },
        { label: 'iso-8859-15', value: 'ISO-8859-15' },
        { label: 'gb2312', value: 'GB2312' },
        { label: 'EUC-JP', value: 'EUC-JP' },
        { label: 'ASCII', value: 'ASCII' },
      ],
    },
    {
      type: 'select',
      name: 'cifs_srv_loglevel',
      placeholder: 'Log Level',
      tooltip: 'Choices are Minimum, Normal, or Debug.',
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
      placeholder: 'Use syslog only',
      tooltip: 'When checked, authentication failures are\
  logged to <i>/var/log/messages</i> instead of the default of\
 <i>/var/log/samba4/log.smbd</i>.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_localmaster',
      placeholder: 'Local Master',
      tooltip: 'Determines whether or not the system participates in\
 a browser election; should be disabled when network contains an AD\
 or LDAP server, and is not necessary when Vista or Windows 7 machines\
 are present.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_domain_logons',
      placeholder: 'Domain Logons',
      tooltip: 'Check this box if it is necessary to provide the netlogin service\
 for older Windows clients.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_timeserver',
      placeholder: 'Time Server For Domain',
      tooltip: 'Determines whether or not the system advertises\
 itself as a time server to Windows clients; should be disabled when\
 network contains an AD or LDAP server.',
    },
    {
      type: 'select',
      name: 'cifs_srv_guest',
      placeholder: 'Guest Account',
      options: [],
      tooltip: 'Account to be used for guest access; default is\
 nobody; account must have permission to access the shared\
 volume/dataset; if Guest Account user is deleted, resets to nobody.',
    },
    { type: 'permissions', 
      name: 'cifs_srv_filemask', 
      placeholder: 'File Mask',
      tooltip: 'Overrides default file creation mask of 0666 which\
 creates files with read and write access for everybody.',
    },
    { type: 'permissions', 
      name: 'cifs_srv_dirmask', 
      placeholder: 'Directory Mask',
      tooltip: 'Overrides default directory creation mask of 0777\
 which grants directory read, write and execute access for everybody.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_nullpw',
      placeholder: 'Allow Empty Password',
      tooltip: 'If checked, users can just press <b>Enter</b>\
 when prompted for a password; requires that the username/password\
 be the same as the Windows user account.',
    },
    {
      type: 'textarea',
      name: 'cifs_srv_smb_options',
      placeholder: 'Auxiliary Parameters',
      tooltip: '<b>smb.conf</b> options not covered elsewhere in this\
 screen; see the <a href="http://www.oreilly.com/openbook/samba/book/appb_02.html" target="_blank">Samba Guide </a>\
 for additional settings.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_unixext',
      placeholder: 'UNIX Extensions',
      tooltip: 'Allows non-Windows SMB clients to access symbolic\
 links and hard links, has no effect on Windows clients.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_zeroconf',
      placeholder: 'Zeroconf share discovery',
      tooltip: 'Enable if Mac clients will be connecting to the SMB share.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_hostlookup',
      placeholder: 'Hostnames Lookups',
      tooltip: 'Allows using hostnames rather than IP addresses in\
 the <i>Hosts Allow</b> or </i>Hosts Deny</b>fields of a SMB share; uncheck\
 if IP addresses are used to avoid the delay of a host lookup.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_allow_execute_always',
      placeholder: 'Allow Execute Always',
      tooltip: 'If checked, Samba will allow the user to execute\
   a file, even if that user’s permissions are not set to execute.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_obey_pam_restrictions',
      placeholder: 'Obey Pam Restrictions',
      tooltip: 'Uncheck this box to allow cross-domain\
 authentication, to allow users and groups to be managed on\
 another forest, or to allow permissions to be delegated from\
 <a href="http://doc.freenas.org/11/directoryservice.html#active-directory" target="_blank">Active Directory</a>\
 users and groups to domain admins on another forest.',
    },
    {
      type: 'checkbox',
      name: 'cifs_srv_ntlmv1_auth',
      placeholder: 'NTLMv1 Auth',
      tooltip: 'when checked, allow NTLMv1 authentication,\
 required by Windows XP clients and sometimes by clients in later\
 versions of Windows.',
    },
    {
      type: 'select',
      name: 'cifs_srv_bindip',
      placeholder: 'Bind IP Addresses',
      tooltip: 'Check the IP addresses on which SMB should listen.',
      options: [],
      multiple: true
    },
  ];

  private cifs_srv_bindip: any;
  private cifs_srv_guest: any;
  ngOnInit() {
    this.iscsiService.getIpChoices().subscribe((res) => {
      this.cifs_srv_bindip =
        _.find(this.fieldConfig, { 'name': 'cifs_srv_bindip' });
      res.forEach((item) => {
        this.cifs_srv_bindip.options.push({ label: item[0], value: item[0] });
      })
    });
    this.idmapService.getADIdmap().subscribe((res) => {});
    this.ws.call('group.query').subscribe((res) => {
      this.cifs_srv_guest = _.find(this.fieldConfig, {'name':'cifs_srv_guest'});
      res.forEach((group) => {
        this.cifs_srv_guest.options.push({ label: group.group, value: group.group });
      });
    });
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef,
    protected iscsiService: IscsiService,
    protected idmapService: IdmapService) {}

  afterInit(entityEdit: any) {}
}
