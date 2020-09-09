import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
import { SupportComponent } from './general-settings/support/support.component';
import { EmailComponent } from './email/';
import { AlertServiceComponent } from './alertservice/alert-service/alert-service.component';
import { AlertConfigComponent } from './alert/alert.component';
import { CertificateAcmeAddComponent } from './certificates/certificate-acme-add/certificate-acme-add.component';
import { FailoverComponent } from './failover/failover.component';
import { ReportingComponent } from './reporting/reporting.component';
import { EulaComponent } from './general-settings/support/eula/eula.component';
import { KmipComponent} from './kmip/kmip.component';
import { T } from '../../translate-marker';
import { TwoFactorComponent } from './two-factor/two-factor.component';
import { CredentialsComponent } from './../credentials/credentials.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';

export const routes: Routes = [
  // {path : '', component : AdvancedComponent }
  {
    path: '',
    data: { title: T('System') },
    children: [{
      path: 'general',
      data: { title: T('General'), breadcrumb: T('General'), icon: 'build' },
      children: [{
        path: '',
        component: GeneralSettingsComponent,
        data: { title: T('General'), breadcrumb: T('General') },
      }]
    }, {
      path: 'advanced',
      component: AdvancedComponent,
      data: { title: T('Advanced'), breadcrumb: T('Advanced'), icon: 'settings' },

    }, {
      path: 'reporting',
      component: ReportingComponent,
      data: { title: T('Reporting'), breadcrumb: T('Reporting') },
    }, {
      path: 'dataset',
      component: DatasetComponent,
      data: { title: T('System Dataset'), breadcrumb: T('System Dataset'), icon: 'storage' },
    }, {
      path: 'boot',
      data: { title: T('Boot'), breadcrumb: T('Boot'), icon: 'replay' },
      children: [{
        path: '',
        component: BootEnvironmentListComponent,
        data: { title: T('Boot Environments'), breadcrumb: T('Boot Environments') },
      }, {
        path: 'clone/:pk',
        component: BootEnvironmentCloneComponent,
        data: { title: T('Clone'), breadcrumb: T('Clone') },
      },
      {
        path: 'rename/:pk',
        component: BootEnvironmentRenameComponent,
        data: { title: T('Rename'), breadcrumb: T('Rename') },
      },
      {
        path: 'create',
        component: BootEnvironmentCreateComponent,
        data: { title: T('Add'), breadcrumb: T('Add') },
      },
      {
        path: 'status',
        component: BootStatusListComponent,
        data: { title: T('Status'), breadcrumb: T('Status') },
      },
      {
        path: 'attach/:pk',
        component: BootEnvAttachFormComponent,
        data: { title: T('Attach'), breadcrumb: ('Attach') },
      },
      {
        path: 'replace/:pk',
        component: BootEnvReplaceFormComponent,
        data: { title: T('Replace'), breadcrumb: T('Replace') },
      }
    ]
    }, {
      path: 'tunable',
      data: { title: T('Tunables'), breadcrumb: T('Tunables'), icon: 'settings_overscan' },
      children: [{
          path: '',
          component: TunableListComponent,
          data: { title: T('Tunables'), breadcrumb: T('Tunables') },
        }, {
          path: 'add',
          component: TunableFormComponent,
          data: { title: T('Add'), breadcrumb: T('Add') },
        },
        {
          path: 'edit/:pk',
          component: TunableFormComponent,
          data: { title: T('Edit'), breadcrumb: T('Edit') },
        }
      ]
    }, {
      path: 'sysctl',
      data: { title: T('Sysctl'), breadcrumb: T('Sysctl'), icon: 'settings_overscan' },
      children: [{
          path: '',
          component: TunableListComponent,
          data: { title: T('Sysctl'), breadcrumb: T('Sysctl') },
        }, {
          path: 'add',
          component: TunableFormComponent,
          data: { title: T('Add'), breadcrumb: T('Add') },
        },
        {
          path: 'edit/:pk',
          component: TunableFormComponent,
          data: { title: T('Edit'), breadcrumb: T('Edit') },
        }
      ]
    },
    {
      path: 'update',
      data: { title: T('Update'), breadcrumb: T('Update'), icon: 'update' },
      children:[
        {
        path:'',
        component: UpdateComponent,
        data: { title: T('Update'), breadcrumb: T('Update') },
        },
        {
          path:'manualupdate',
          data: {title:T('Manual Update'), breadcrumb: T('Manual Update')},
          children:[
            {
              path:'',
              component: ManualUpdateComponent,
              data: { title: T('Manual Update'), breadcrumb: T('Manual Update') },
            }
          ]
        },
      ]
    },
    {
      path : 'email', 
      component : EmailComponent,
      data: { title: T('Email'), breadcrumb: T('Email'), icon: 'email' },
    },
    {
      path : 'alertsettings',
      component : AlertConfigComponent,
      data: { title: T('Alert Settings'), breadcrumb: T('Alert Settings'), icon: 'notifications_active' },
    },
    {
      path: 'alertservice',
      data: { title: T('Alert Services'), breadcrumb: T('Alert Services'), icon: 'notifications' },
      children: [{
          path: '',
          component: AlertServiceListComponent,
          data: { title: T('Alert Services'), breadcrumb: T('Alert Services') },
        }, {
          path: 'add',
          component: AlertServiceComponent,
          data: { title: T('Add Alert Service'), breadcrumb: T('Add Alert Service') },
        }, {
          path: 'edit/:pk',
          component: AlertServiceComponent,
          data: { title: T('Edit Alert Service'), breadcrumb: T('Edit Alert Service') },
        }
      ]
    },{
      path: 'cloudcredentials',
      data: { title: T('Cloud Credentials'), breadcrumb: T('Cloud Credentials'), icon: 'cloud_circle' },
      children: [{
          path: '',
          component: CloudCredentialsListComponent,
          data: { title: T('Cloud Credentials'), breadcrumb: T('Cloud Credentials') },
        },
        {
          path: 'add',
          component: CloudCredentialsFormComponent,
          data: { title: T('Add'), breadcrumb: T('Add') },
        },
        {
          path: 'edit/:pk',
          component: CloudCredentialsFormComponent,
          data: { title: T('Edit'), breadcrumb: T('Edit') },
        },
      ]
    },
    {
      path: 'sshconnections',
      data: { title: T('SSH Connections'), breadcrumb: T('SSH Connections'), icon: 'cloud_circle'},
      children: [
        {
          path: '',
          component: SshConnectionsListComponent,
          data: { title: T('SSH Connections'), breadcrumb: T('SSH Connections'), icon: 'cloud_circle'},
        },
        {
          path: 'add',
          component: SshConnectionsFormComponent,
          data: { title: T('Add'), breadcrumb: T('Add') },
        },
        {
          path: 'edit/:pk',
          component: SshConnectionsFormComponent,
          data: { title: T('Edit'), breadcrumb: T('Edit') },
        }]
      },
      {
        path: 'sshkeypairs',
        data: { title: T('SSH Keypairs'), breadcrumb: T('SSH Keypairs'), icon: 'vpn_key' },
        children: [{
          path: '',
          component: SshKeypairsListComponent,
          data: { title: T('SSH Keypairs'), breadcrumb: T('SSH Keypairs') },
        }, {
          path: 'add',
          component: SshKeypairsFormComponent,
          data: { title: T('Add'), breadcrumb: T('Add') },
        }, {
          path: 'edit/:pk',
          component: SshKeypairsFormComponent,
          data: { title: T('Edit'), breadcrumb: T('Edit') },
        }
      ]
    },
    {
      path: 'ca',
      data: { title: T('Certificate Authorities'), breadcrumb: T('Certificate Authorities'), icon: 'card_membership' },
      children: [{
        path: '',
        component: CertificateAuthorityListComponent,
        data: { title: T('Certificate Authorities'), breadcrumb: T('Certificate Authorities') },
      }, 
      {
        path: 'add',
        component: CertificateAuthorityAddComponent,
        data: { title: T('Add'), breadcrumb: T('Add') },
      },
      {
        path: 'view/:pk',
        component: CertificateAuthorityEditComponent,
        data: { title: T('View'), breadcrumb: T('View') },
      },
      {
        path: 'sign/:pk',
        component: CertificateAuthoritySignComponent,
        data: { title: T('Sign CSR'), breadcrumb: T('Sign CSR') },
      }]
    }, {
      path: 'kmip',
      component: KmipComponent,
      data: { title: 'KMIP', breadcrumb: 'KMIP', icon: 'dns'},
    }, {
      path: 'certificates',
      data: { title: T('Certificates'), breadcrumb: T('Certificates'), icon: 'turned_in' },
      children: [{
        path: '',
        component: CertificateListComponent,
        data: { title: T('Certificates'), breadcrumb: T('Certificates') },
      }, {
        path: 'add',
        component: CertificateAddComponent,
        data: { title: T('Add'), breadcrumb: T('Add') },
      }, {
        path: 'addacme/:pk',
        component: CertificateAcmeAddComponent,
        data: { title: T('Add ACME Certificate'), breadcrumb: T('Add ACME Certificate') },
      }, {
        path: 'view/:pk',
        component: CertificateEditComponent,
        data: { title: T('View'), breadcrumb: T('View') },
      }]
    }, {
      path: 'acmedns',
      data: { title: T('ACME DNS Authenticators'), breadcrumb: T('ACME DNS Authenticators'), icon: 'turned_in' },
      children: [{
        path: '',
        component: AcmednsListComponent,
        data: { title: T('ACME DNS Authenticators'), breadcrumb: T('ACME DNS Authenticators') },
      }, 
      {
        path: 'add',
        component: AcmednsFormComponent,
        data: { title: T('Add'), breadcrumb: T('Add') },
      }, 
      {
        path: 'edit/:pk',
        component: AcmednsFormComponent,
        data: { title: T('Edit'), breadcrumb: T('Edit') },
      }
    ]
  }, {
      path: 'failover',
      component: FailoverComponent,
      data: { title: T('Failover'), breadcrumb: T('Failover'), icon: 'device_hub' }
    }, 
    {
      path: 'support',
      data: { title: T('Support'), breadcrumb: T('Support'), icon: 'perm_phone_msg' },
      children: [
        {
          path: '',
          component: SupportComponent,
          data: { title: T('Support'), breadcrumb: T('Support') },
        },
        {
          path: 'eula',
          component: EulaComponent,
          data: { title: T('EULA'), breadcrumb: T('EULA')}
        }
      ]
    },
    {
      path: 'two-factor',
      component: TwoFactorComponent,
      data: { title: T('Two-Factor Auth'), breadcrumb: T('Two-Factor Auth') },
    },
    {
      path: 'temp-misc',
      component: CredentialsComponent,
      data: { title: ('Credentials') }
    }
    ]
  }
];
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
