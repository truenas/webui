import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  WebSocketService,
  SystemGeneralService,
  ValidationService,
  DialogService,
  IdmapService,
  UserService,
} from '../../services';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { ModalService } from '../../services/modal.service';
import helptext from '../../helptext/directoryservice/dashboard';
import idmapHelptext from '../../helptext/directoryservice/idmap';
import { AppLoaderService } from '../../services/app-loader/app-loader.service';
import { T } from 'app/translate-marker';
import { EmptyType } from 'app/pages/common/entity/entity-empty/entity-empty.component';
import { InputTableConf } from 'app/pages/common/entity/table/table.component';
import { EmptyConfig } from '../common/entity/entity-empty/entity-empty.component';
import { LdapComponent } from './ldap/ldap.component';
import { ActiveDirectoryComponent } from './activedirectory/activedirectory.component';
import { IdmapFormComponent } from './idmap/idmap-form.component';
import { KerberosSettingsComponent } from './kerberossettings/kerberossettings.component';
import { KerberosRealmsFormComponent } from './kerberosrealms/kerberosrealms-form.component';
import { KerberosKeytabsFormComponent } from './kerberoskeytabs/kerberoskeytabs-form.component';

@Component({
  selector: 'directoryservices',
  templateUrl: './directoryservices.component.html',
  providers: [DatePipe, UserService],
})
export class DirectoryservicesComponent implements OnInit, OnDestroy {
  dataCards = [];
  tableCards = [];

  refreshOnClose: Subscription;

  // Components included in this dashboard
  protected ldapFormComponent: LdapComponent;
  protected activeDirectoryFormComponent: ActiveDirectoryComponent;
  protected idmapFormComponent: IdmapFormComponent;
  protected kerberosSettingFormComponent: KerberosSettingsComponent;
  protected kerberosRealmsFormComponent: KerberosRealmsFormComponent;
  protected kerberosKeytabsFormComponent: KerberosKeytabsFormComponent;

  public emptyPageConf: EmptyConfig = {
    type: EmptyType.no_page_data,
    title: T('No sysctls configured'),
    large: false,
    message: T('To configure sysctls, click the "Add" button.'),
  };
  public is_ha = false;
  public formEvents: Subject<CoreEvent>;
  public actionsConfig;
  protected dialogRef: any;

  public idmapTableConf: InputTableConf = {
    title: helptext.idmap.title,
    titleHref: '/directoryservice/idmap',
    queryCall: 'idmap.query',
    deleteCall: 'idmap.delete',
    deleteMsg: {
      title: helptext.idmap.title,
      key_props: ['name'],
    },
    emptyEntityLarge: false,
    parent: this,
    columns: [
      { name: T('Name'), prop: 'name', always_display: true, minWidth: 250 },
      { name: T('Backend'), prop: 'idmap_backend', maxWidth: 100 },
      { name: T('DNS Domain Name'), prop: 'dns_domain_name' },
      { name: T('Range Low'), prop: 'range_low' },
      { name: T('Range High'), prop: 'range_high' },
      { name: T('Certificate'), prop: 'cert_name' },
    ],
    add: function () {
      this.parent.doAdd('idmap');
    },
    edit: function (row) {
      this.parent.doAdd('idmap', row.id);
    },
  };

  public kerberosRealmsTableConf: InputTableConf = {
    title: helptext.kerboerosRealms.title,
    titleHref: '/directoryservice/kerberosrealms',
    queryCall: 'kerberos.realm.query',
    deleteCall: 'kerberos.realm.delete',
    deleteMsg: {
      title: helptext.kerboerosRealms.title,
      key_props: ['realm'],
    },
    emptyEntityLarge: false,
    parent: this,
    columns: [
      { name: T('Realm'), prop: 'realm', always_display: true },
      { name: T('KDC'), prop: 'kdc' },
      { name: T('Admin Server'), prop: 'admin_server' },
      { name: T('Password Server'), prop: 'kpasswd_server' },
    ],
    add: function () {
      this.parent.doAdd('kerberos_realms');
    },
    edit: function (row) {
      this.parent.doAdd('kerberos_realms', row.id);
    },
  };

  public kerberosKeytabTableConf: InputTableConf = {
    title: helptext.kerboerosKeytab.title,
    titleHref: '/directoryservice/kerberoskeytabs',
    queryCall: 'kerberos.keytab.query',
    deleteCall: 'kerberos.keytab.delete',
    deleteMsg: {
      title: helptext.kerboerosKeytab.title,
      key_props: ['name'],
    },
    emptyEntityLarge: false,
    parent: this,
    columns: [
      { name: 'Name', prop: 'name', always_display: true },
    ],
    add: function () {
      this.parent.doAdd('kerberos_keytab');
    },
    edit: function (row) {
      this.parent.doAdd('kerberos_keytab', row.id);
    },
  };


  constructor(
    private ws: WebSocketService,
    protected idmapService: IdmapService,
    protected validationService: ValidationService,
    protected route: ActivatedRoute,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private router: Router,
    public mdDialog: MatDialog,
    public datePipe: DatePipe,
    protected userService: UserService,
  ) { }

  ngOnInit(): void {
    this.tableCards = [
      {
        id: 'idmap',
        title: helptext.idmap.title,
        tableConf: this.idmapTableConf,
      },
      {
        id: 'kerberos_realms',
        title: helptext.kerboerosRealms.title,
        tableConf: this.kerberosRealmsTableConf,
      },
      {
        id: 'kerberos_keytab',
        title: helptext.kerboerosKeytab.title,
        tableConf: this.kerberosKeytabTableConf,
      },
    ];

    this.getDataCardData();
    this.refreshOnClose = this.modalService.onClose$.subscribe(() => {
      this.refreshTables();
    });

    this.refreshForms();
  }

  getDataCardData() {

    const activeDirectoryPromise = this.ws.call('activedirectory.config').toPromise();
    const ldapPromise = this.ws.call('ldap.config').toPromise();
    const kerberosSettingsPromise = this.ws.call('kerberos.config').toPromise();

    this.loader.open();
    Promise.all([activeDirectoryPromise, ldapPromise, kerberosSettingsPromise]).then(
      (res) => {
        this.loader.close();

        let activeDirectoryDomainName = null;
        let activeDirectoryDomainAccountName = null;
        if (res[0]) {
          activeDirectoryDomainName = res[0].domainname;
          activeDirectoryDomainAccountName = res[0].bindname;
        }

        let ldapHostname = null;
        let ldapBaseDN = null;
        let ldapBindDN = null;

        if (res[1]) {
          ldapHostname = res[1].hostname.join(",");
          ldapBaseDN = res[1].basedn;
          ldapBindDN = res[1].binddn;
        }

        let kerberosSettingsAppdefaults = null;
        let kerberosSettingsLibdefaults = null;

        if (res[2]) {
          kerberosSettingsAppdefaults = res[2].appdefaults_aux;
          kerberosSettingsLibdefaults = res[2].libdefaults_aux;
        }

        this.dataCards = [
          {
            title: helptext.activeDirectory.title,
            id: 'activedirectory',
            items: [
              {
                label: helptext.activeDirectory.domainName,
                value: activeDirectoryDomainName,
              },
              {
                label: helptext.activeDirectory.domainAccountName,
                value: activeDirectoryDomainAccountName,
              },
            ],
          },
          {
            title: helptext.ldap.title,
            id: 'ldap',
            items: [
              {
                label: helptext.ldap.hostname,
                value: ldapHostname,
              },
              {
                label: helptext.ldap.baseDN,
                value: ldapBaseDN,
              },
              {
                label: helptext.ldap.bindDN,
                value: ldapBindDN,
              },
            ],
          },
          {
            id: 'kerberos_settings',
            title: helptext.kerberosSettings.title,
            items: [
              {
                label: helptext.kerberosSettings.appdefaults,
                value: kerberosSettingsAppdefaults,
              },
              {
                label: helptext.kerberosSettings.libdefaults,
                value: kerberosSettingsLibdefaults,
              },
            ],
          },
        ];
      }
    );
  }

  doAdd(name: string, id?: number) {
    let addComponent;
    switch (name) {
      case 'activedirectory':
        addComponent = this.activeDirectoryFormComponent;
        break;
      case 'ldap':
        addComponent = this.ldapFormComponent;
        break;
      case 'idmap':
        addComponent = this.idmapFormComponent;
        break;
      case 'kerberos_realms':
        addComponent = this.kerberosRealmsFormComponent;
        break;
      case 'kerberos_settings':
        addComponent = this.kerberosSettingFormComponent;
        break;
      case 'kerberos_keytab':
        addComponent = this.kerberosKeytabsFormComponent;
        break;
      default:
        break;
    }

    if (name == 'idmap' && !id) {
      this.idmapService.getADStatus().subscribe((res) => {
        if (res.enable) {
          this.modalService.open('slide-in-form', addComponent, id);
        } else {
          this.dialog.confirm(idmapHelptext.idmap.enable_ad_dialog.title, idmapHelptext.idmap.enable_ad_dialog.message,
            true, idmapHelptext.idmap.enable_ad_dialog.button).subscribe((res) => {
              if (res) {
                addComponent = this.activeDirectoryFormComponent;
                this.modalService.open('slide-in-form', addComponent, id);
              }
            })
        }
      })
    } else {
      this.modalService.open('slide-in-form', addComponent, id);
    }
  }


  refreshTables() {
    this.getDataCardData();
    this.tableCards.forEach((card) => {
      if (card.tableConf?.tableComponent) {
        card.tableConf.tableComponent.getData();
      }
    });
  }

  
  refreshForms() {
    this.activeDirectoryFormComponent = new ActiveDirectoryComponent(
      this.router,
      this.ws,
      this.modalService,
      this.sysGeneralService,
      this.dialog,
    );

    this.ldapFormComponent = new LdapComponent(
      this.router,
      this.ws,
      this.modalService,
      this.dialog,
      this.sysGeneralService,
    );

    this.idmapFormComponent = new IdmapFormComponent(
      this.idmapService,
      this.validationService,
      this.modalService,
      this.dialog,
      this.mdDialog,
    );

    this.kerberosSettingFormComponent = new KerberosSettingsComponent();
    this.kerberosRealmsFormComponent = new KerberosRealmsFormComponent(this.modalService);
    this.kerberosKeytabsFormComponent = new KerberosKeytabsFormComponent(this.modalService);
  }

  ngOnDestroy() {
    this.refreshOnClose.unsubscribe();
  }
}
