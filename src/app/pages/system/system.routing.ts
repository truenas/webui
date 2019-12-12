import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//import {GeneralComponent} from './general/';

import { GeneralComponent } from './general/general.component';
import { AdvancedComponent } from './advanced/';
import { ViewEnclosureComponent } from './viewenclosure/';
import { DatasetComponent } from './dataset/';
import { BootEnvironmentCloneComponent } from './bootenv/bootenv-clone/';
import { BootEnvironmentRenameComponent } from './bootenv/bootenv-rename/';
import { BootEnvironmentCreateComponent } from './bootenv/bootenv-create';
import { BootStatusListComponent } from './bootenv/bootenv-status/';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/';
import { BootEnvAttachFormComponent } from './bootenv/bootenv-attach';
import { BootEnvReplaceFormComponent } from './bootenv/bootenv-replace';
import { TunableFormComponent } from './tunable/tunable-form/';
import { TunableListComponent } from './tunable/tunable-list/';
import { UpdateComponent } from './update/';
import { ManualUpdateComponent } from './update/manualupdate/';
import { NTPServerFormComponent } from './ntpservers/ntpserver-form';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { CloudCredentialsListComponent } from './CloudCredentials/CloudCredentials-list/';
import { CloudCredentialsFormComponent } from './CloudCredentials/cloudcredentials-form/';
import { SshConnectionsListComponent } from './ssh-connections/ssh-connections-list/ssh-connections-list.component';
import { SshConnectionsFormComponent } from './ssh-connections/ssh-connections-form/ssh-connections-form.component';
import { SshKeypairsListComponent } from './ssh-keypairs/ssh-keypairs-list/ssh-keypairs-list.component';
import { SshKeypairsFormComponent } from './ssh-keypairs/ssh-keypairs-form/ssh-keypairs-form.component';
import { CertificateAuthorityListComponent } from './ca/ca-list/';
import { CertificateAuthorityAddComponent } from './ca/ca-add/';
import { CertificateAuthorityEditComponent } from './ca/ca-edit/';
import { CertificateAuthoritySignComponent } from './ca/ca-sign/';
import { CertificateEditComponent } from './certificates/certificate-edit/';
import { CertificateListComponent } from './certificates/certificate-list';
import { CertificateAddComponent } from './certificates/certificate-add';
import { AcmednsListComponent } from './acmedns/acmedns-list/acmedns-list.component';
import { AcmednsFormComponent } from './acmedns/acmedns-add/acmedns-form.component';
import { SupportComponent } from './support/support.component';
import { EmailComponent } from './email/';
import { AlertServiceComponent } from './alertservice/alert-service/alert-service.component';
import { AlertConfigComponent } from './alert/alert.component';
import { EntityDashboardComponent } from '../common/entity/entity-dashboard/entity-dashboard.component';
import { CertificateAcmeAddComponent } from './certificates/certificate-acme-add/certificate-acme-add.component';
import { FailoverComponent } from './failover/failover.component';
import { ReportingComponent } from './reporting/reporting.component';
import { EulaComponent } from './support/eula/eula.component';

export const routes: Routes = [
  // {path : '', component : GeneralComponent },
  // {path : '', component : AdvancedComponent }
  {
    path: '',
    data: { title: 'System' },
    children: [{
      path: '',
      component: EntityDashboardComponent,
    }, {
      path: 'general',
      data: { title: 'General', breadcrumb: 'General', icon: 'build' },
      children: [{
        path: '',
        component: GeneralComponent,
        data: { title: 'General', breadcrumb: 'General' },
      }]
    }, {
      path: 'advanced',
      component: AdvancedComponent,
      data: { title: 'Advanced', breadcrumb: 'Advanced', icon: 'settings' },
    }, {
      path: 'viewenclosure',
      component: ViewEnclosureComponent,
      data: { title: 'View Enclosure', breadcrumb: 'View Enclosure', icon: 'settings' },
    }, {
      path: 'reporting',
      component: ReportingComponent,
      data: { title: 'Reporting', breadcrumb: 'Reporting' },
    }, {
      path: 'dataset',
      component: DatasetComponent,
      data: { title: 'System Dataset', breadcrumb: 'System Dataset', icon: 'storage' },
    }, {
      path: 'boot',
      data: { title: 'Boot', breadcrumb: 'Boot', icon: 'replay' },
      children: [{
        path: '',
        component: BootEnvironmentListComponent,
        data: { title: 'Boot Environments', breadcrumb: 'Boot Environments' },
      }, {
        path: 'clone/:pk',
        component: BootEnvironmentCloneComponent,
        data: { title: 'Clone', breadcrumb: 'Clone' },
      },
      {
        path: 'rename/:pk',
        component: BootEnvironmentRenameComponent,
        data: { title: 'Rename', breadcrumb: 'Rename' },
      },
      {
        path: 'create',
        component: BootEnvironmentCreateComponent,
        data: { title: 'Create', breadcrumb: 'Create' },
      },
      {
        path: 'status',
        component: BootStatusListComponent,
        data: { title: 'Status', breadcrumb: 'Status' },
      },
      {
        path: 'attach/:pk',
        component: BootEnvAttachFormComponent,
        data: { title: 'Attach', breadcrumb: 'Attach' },
      },
      {
        path: 'replace/:pk',
        component: BootEnvReplaceFormComponent,
        data: { title: 'Replace', breadcrumb: 'Replace' },
      }
    ]
    }, {
      path: 'tunable',
      data: { title: 'Tunables', breadcrumb: 'Tunables', icon: 'settings_overscan' },
      children: [{
          path: '',
          component: TunableListComponent,
          data: { title: 'Tunables', breadcrumb: 'Tunables' },
        }, {
          path: 'add',
          component: TunableFormComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        },
        {
          path: 'edit/:pk',
          component: TunableFormComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }
      ]
    }, {
      path: 'update',
      data: { title: 'Update', breadcrumb: 'Update', icon: 'update' },
      children:[
        {
        path:'',
        component: UpdateComponent,
        data: { title: 'Update', breadcrumb: 'Update' },
        },
        {
          path:'manualupdate',
          data: {title:'Manual Update', breadcrumb: 'Manual Update'},
          children:[
            {
              path:'',
              component: ManualUpdateComponent,
              data: { title: 'Manual Update', breadcrumb: 'Manual Update' },
            }
          ]
        },
      ]
    },
     {
      path: 'ntpservers',
      data: { title: 'NTP Servers', breadcrumb: 'NTP Servers', icon: 'device_hub' },
      children: [{
          path: '',
          component: NTPServerListComponent,
          data: { title: 'NTP Servers', breadcrumb: 'NTP Servers' },
        }, {
          path: 'add',
          component: NTPServerFormComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        },
        {
          path: 'edit/:pk',
          component: NTPServerFormComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }
      ]
    }, 
    {
      path : 'email', 
      component : EmailComponent,
      data: { title: 'Email', breadcrumb: 'Email', icon: 'email' },
    },
    {
      path : 'alertsettings',
      component : AlertConfigComponent,
      data: { title: 'Alert Settings', breadcrumb: 'Alert Settings', icon: 'notifications_active' },
    },
    {
      path: 'alertservice',
      data: { title: 'Alert Services', breadcrumb: 'Alert Services', icon: 'notifications' },
      children: [{
          path: '',
          component: AlertServiceListComponent,
          data: { title: 'Alert Services', breadcrumb: 'Alert Services' },
        }, {
          path: 'add',
          component: AlertServiceComponent,
          data: { title: 'Add Alert Service', breadcrumb: 'Add Alert Service' },
        }, {
          path: 'edit/:pk',
          component: AlertServiceComponent,
          data: { title: 'Edit Alert Service', breadcrumb: 'Edit Alert Service' },
        }
      ]
    },{
      path: 'cloudcredentials',
      data: { title: 'Cloud Credentials', breadcrumb: 'Cloud Credentials', icon: 'cloud_circle' },
      children: [{
          path: '',
          component: CloudCredentialsListComponent,
          data: { title: 'Cloud Credentials', breadcrumb: 'Cloud Credentials' },
        },
        {
          path: 'add',
          component: CloudCredentialsFormComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        },
        {
          path: 'edit/:pk',
          component: CloudCredentialsFormComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        },
      ]
    },
    {
      path: 'sshconnections',
      data: { title: 'SSH Connections', breadcrumb: 'SSH Connections', icon: 'cloud_circle'},
      children: [
        {
          path: '',
          component: SshConnectionsListComponent,
          data: { title: 'SSH Connections', breadcrumb: 'SSH Connections', icon: 'cloud_circle'},
        },
        {
          path: 'add',
          component: SshConnectionsFormComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        },
        {
          path: 'edit/:pk',
          component: SshConnectionsFormComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }]
      },
      {
        path: 'sshkeypairs',
        data: { title: 'SSH Keypairs', breadcrumb: 'SSH Keypairs', icon: 'vpn_key' },
        children: [{
          path: '',
          component: SshKeypairsListComponent,
          data: { title: 'SSH Keypairs', breadcrumb: 'SSH Keypairs' },
        }, {
          path: 'add',
          component: SshKeypairsFormComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        }, {
          path: 'edit/:pk',
          component: SshKeypairsFormComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }
      ]
    },
    {
      path: 'ca',
      data: { title: 'Certificate Authorities', breadcrumb: 'Certificate Authorities', icon: 'card_membership' },
      children: [{
        path: '',
        component: CertificateAuthorityListComponent,
        data: { title: 'Certificate Authorities', breadcrumb: 'Certificate Authorities' },
      }, 
      {
        path: 'add',
        component: CertificateAuthorityAddComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      },
      {
        path: 'view/:pk',
        component: CertificateAuthorityEditComponent,
        data: { title: 'View', breadcrumb: 'View' },
      },
      {
        path: 'sign/:pk',
        component: CertificateAuthoritySignComponent,
        data: { title: 'Sign CSR', breadcrumb: 'Sign CSR' },
      }]
    }, {
      path: 'certificates',
      data: { title: 'Certificates', breadcrumb: 'Certificates', icon: 'turned_in' },
      children: [{
        path: '',
        component: CertificateListComponent,
        data: { title: 'Certificates', breadcrumb: 'Certificates' },
      }, {
        path: 'add',
        component: CertificateAddComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'addacme/:pk',
        component: CertificateAcmeAddComponent,
        data: { title: 'Add ACME Certificate', breadcrumb: 'Add ACME Certificate' },
      }, {
        path: 'view/:pk',
        component: CertificateEditComponent,
        data: { title: 'View', breadcrumb: 'View' },
      }]
    }, {
      path: 'acmedns',
      data: { title: 'ACME DNS Authenticators', breadcrumb: 'ACME DNS Authenticators', icon: 'turned_in' },
      children: [{
        path: '',
        component: AcmednsListComponent,
        data: { title: 'ACME DNS Authenticators', breadcrumb: 'ACME DNS Authenticators' },
      }, 
      {
        path: 'add',
        component: AcmednsFormComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, 
      {
        path: 'edit/:pk',
        component: AcmednsFormComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }
    ]
  }, {
      path: 'failover',
      component: FailoverComponent,
      data: { title: 'Failover', breadcrumb: 'Failover', icon: 'device_hub' }
    }, 
    {
      path: 'support',
      data: { title: 'Support', breadcrumb: 'Support', icon: 'perm_phone_msg' },
      children: [
        {
          path: '',
          component: SupportComponent,
          data: { title: 'Support', breadcrumb: 'Support' },
        },
        {
          path: 'eula',
          component: EulaComponent,
          data: { title: 'EULA', breadcrumb: 'EULA'}
        }
      ]
    }
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
