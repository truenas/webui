import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//import {GeneralComponent} from './general/';

import { GeneralComponent } from './general/general.component';
import { ConfigSaveComponent } from './general/config-save/config-save.component';
import { ConfigUploadComponent } from './general/config-upload/config-upload.component';
import { ConfigResetComponent } from './general/config-reset/config-reset.component';
import { AdvancedComponent } from './advanced/';
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
import {ManualUpdateConfigSaveComponent} from './update/manualupdate/manualupdateconfig-save/'
import { NTPServerAddComponent } from './ntpservers/ntpserver-add/';
import { NTPServerEditComponent } from './ntpservers/ntpserver-edit/';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { CloudCredentialsListComponent } from './CloudCredentials/CloudCredentials-list/';
import { CloudCredentialsFormComponent } from './CloudCredentials/cloudcredentials-form/';
import { CertificateAuthorityListComponent } from './ca/ca-list/';
import { CertificateAuthorityAddComponent } from './ca/ca-add/';
import { CertificateAuthoritySignComponent } from './ca/ca-sign/';
import { CertificateEditComponent } from './certificates/certificate-edit/';
import { CertificateListComponent } from './certificates/certificate-list';
import { CertificateAddComponent } from './certificates/certificate-add';
import { SupportComponent } from './support/support.component';
import {EmailComponent} from './email/';
import { AlertServiceComponent } from './alertservice/alert-service/alert-service.component';
import { AlertConfigComponent } from './alert/alert.component';

export const routes: Routes = [
  // {path : '', component : GeneralComponent },
  // {path : '', component : AdvancedComponent }
  {
    path: '',
    data: { title: 'System' },
    children: [{
      path: 'general',
      data: { title: 'General', breadcrumb: 'General' },
      children: [{
        path: '',
        component: GeneralComponent,
        data: { title: 'General', breadcrumb: 'General' },
      }, {
        path: 'config-save',
        component: ConfigSaveComponent,
        data: { title: 'Config Save', breadcrumb: 'Config Save' },
      }, {
        path: 'config-upload',
        component: ConfigUploadComponent,
        data: { title: 'Config Upload', breadcrumb: 'Config Upload' },
      }, {
        path: 'config-reset',
        component: ConfigResetComponent,
        data: { title: 'Config Reset', breadcrumb: 'Config Reset' },
      }]
    }, {
      path: 'advanced',
      component: AdvancedComponent,
      data: { title: 'Advanced', breadcrumb: 'Advanced' },
    },{
      path: 'dataset',
      component: DatasetComponent,
      data: { title: 'Dataset', breadcrumb: 'Dataset' },
    }, {
      path: 'bootenv',
      data: { title: 'Boot Environments', breadcrumb: 'Boot Environments' },
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
      data: { title: 'Tunable', breadcrumb: 'Tunable' },
      children: [{
          path: '',
          component: TunableListComponent,
          data: { title: 'Tunable', breadcrumb: 'Tunable' },
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
      data: { title: 'Update', breadcrumb: 'Update' },
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
            },
            {
              path:'saveconfig',
              component: ManualUpdateConfigSaveComponent,
              data: {title:'Save Config', breadcrumb: 'config'}
            }
          ]
        },
      ]
    },
     {
      path: 'ntpservers',
      data: { title: 'NTP Servers', breadcrumb: 'NTP Servers' },
      children: [{
          path: '',
          component: NTPServerListComponent,
          data: { title: 'NTP Servers', breadcrumb: 'NTP Servers' },
        }, {
          path: 'add',
          component: NTPServerAddComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        },
        {
          path: 'edit/:pk',
          component: NTPServerEditComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }
      ]
    }, 
    {
      path : 'email', 
      component : EmailComponent,
      data: { title: 'Email', breadcrumb: 'Email' },
    },
    {
      path : 'alertsettings',
      component : AlertConfigComponent,
      data: { title: 'Alert Settings', breadcrumb: 'Alert Settings' },
    },
    {
      path: 'alertservice',
      data: { title: 'Alert Services', breadcrumb: 'Alert Services' },
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
      data: { title: 'CloudCredentials', breadcrumb: 'CloudCredentials' },
      children: [{
          path: '',
          component: CloudCredentialsListComponent,
          data: { title: 'CloudCredentials', breadcrumb: 'CloudCredentials' },
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
      path: 'ca',
      data: { title: 'Certificate Authorities', breadcrumb: 'Certificate Authorities' },
      children: [{
        path: '',
        component: CertificateAuthorityListComponent,
        data: { title: 'Certificate Authorities', breadcrumb: 'Certificate Authorities' },
      }, 
      {
        path: 'add',
        component: CertificateAuthorityAddComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'sign/:pk',
        component: CertificateAuthoritySignComponent,
        data: { title: 'Sign CSR', breadcrumb: 'Sign CSR' },
      }]
    }, {
      path: 'certificates',
      data: { title: 'Certificates', breadcrumb: 'Certificates' },
      children: [{
        path: '',
        component: CertificateListComponent,
        data: { title: 'Certificates', breadcrumb: 'Certificates' },
      }, {
        path: 'add',
        component: CertificateAddComponent,
        data: { title: 'Add', breadcrumb: 'Add' },
      }, {
        path: 'edit/:pk',
        component: CertificateEditComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }]
    }, {
      path: 'support',
      component: SupportComponent,
      data: { title: 'Support', breadcrumb: 'Support' },
    },]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
