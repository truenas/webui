import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//import {GeneralComponent} from './general/';

import { GeneralComponent } from './general/general.component';
import { ConfigSaveComponent } from './general/config-save/config-save.component';
import { ConfigUploadComponent } from './general/config-upload/config-upload.component';
import { ConfigResetComponent } from './general/config-reset/config-reset.component';
import { AdvancedComponent } from './advanced/';
import { BootEnvironmentCloneComponent } from './bootenv/bootenv-clone/';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/';
import { TunableFormComponent } from './tunable/tunable-form/';
import { TunableListComponent } from './tunable/tunable-list/';
import { UpdateComponent } from './update/';
import { NTPServerAddComponent } from './ntpservers/ntpserver-add/';
import { NTPServerEditComponent } from './ntpservers/ntpserver-edit/';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { AlertServiceAWSComponent } from './alertservice/alertservice-aws/';
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { CloudCredentialsGCSComponent } from './CloudCredentials/CloudCredentials-gcs/';
import { CloudCredentialsB2Component } from './CloudCredentials/CloudCredentials-b2/';
import { CloudCredentialsAmazonComponent } from './CloudCredentials/CloudCredentials-amazon/';
import { CloudCredentialsListComponent } from './CloudCredentials/CloudCredentials-list/';
import { CloudCredentialsDeleteComponent } from './CloudCredentials/CloudCredentials-delete/';
import { CertificateAuthorityImportComponent } from './ca/ca-import/';
import { CertificateAuthorityIntermediateComponent } from './ca/ca-intermediate/';
import { CertificateAuthorityInternalComponent } from './ca/ca-internal/';
import { CertificateAuthorityListComponent } from './ca/ca-list/';
import { CAFormComponent } from './ca/ca-form/';
import { CertificateCSRComponent } from './certificates/certificate-csr/';
import { CertificateEditComponent } from './certificates/certificate-edit/';
import { CertificateImportComponent } from './certificates/certificate-import/';
import { CertificateInternalComponent } from './certificates/certificate-internal/';
import { CertificateListComponent } from './certificates/certificate-list';
import { SupportComponent } from './support/support.component';

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
      }]
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
      component: UpdateComponent,
      data: { title: 'Update', breadcrumb: 'Update' },
    }, {
      path: 'ntpservers',
      data: { title: 'NTPservers', breadcrumb: 'NTPservers' },
      children: [{
          path: '',
          component: NTPServerListComponent,
          data: { title: 'NTPservers', breadcrumb: 'NTPservers' },
        }, {
          path: 'add',
          component: NTPServerAddComponent,
          data: { title: 'Add', breadcrumb: 'Add' },
        },
      ]
    }, {
      path: 'alertservice',
      data: { title: 'AlertService', breadcrumb: 'AlertService' },
      children: [{
          path: '',
          component: AlertServiceListComponent,
          data: { title: 'AlertService', breadcrumb: 'AlertService' },
        }, {
          path: 'aws',
          component: AlertServiceAWSComponent,
          data: { title: 'AddAWS', breadcrumb: 'AddAWS' },
        },
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
          path: 'gcs',
          component: CloudCredentialsGCSComponent,
          data: { title: 'gcs', breadcrumb: 'gcs' },
        },
        {
          path: 'gcs/:pk',
          component: CloudCredentialsGCSComponent,
          data: { title: 'gcs', breadcrumb: 'gcs' },
        },
        {
          path: 'amazon',
          component: CloudCredentialsAmazonComponent,
          data: { title: 'amazon', breadcrumb: 'amazon' },
        },
        {
          path: 'amazon/:pk',
          component: CloudCredentialsAmazonComponent,
          data: { title: 'amazon', breadcrumb: 'amazon' },
        },
        {
          path: 'b2',
          component: CloudCredentialsB2Component,
          data: { title: 'b2', breadcrumb: 'b2' },
        },
        {
          path: 'b2/:pk',
          component: CloudCredentialsB2Component,
          data: { title: 'b2', breadcrumb: 'b2' },
        },
        {
          path: ':pk/delete',
          component: CloudCredentialsDeleteComponent,
          data: { title: 'delete', breadcrumb: 'delete' },
        },
      ]
    },
    {
      path: 'ca',
      data: { title: 'CAs', breadcrumb: 'CAs' },
      children: [{
        path: '',
        component: CertificateAuthorityListComponent,
        data: { title: 'CAs', breadcrumb: 'CAs' },
      }, {
        path: 'import',
        component: CertificateAuthorityImportComponent,
        data: { title: 'Import', breadcrumb: 'Import' },
      }, {
        path: 'internal',
        component: CertificateAuthorityInternalComponent,
        data: { title: 'Internal', breadcrumb: 'Internal' },
      }, {
        path: 'intermediate',
        component: CertificateAuthorityIntermediateComponent,
        data: { title: 'Intermediate', breadcrumb: 'Intermediate' },
      }, {
        path: 'edit/:pk',
        component: CertificateEditComponent,
        data: { title: 'Edit', breadcrumb: 'Edit' },
      }]
    }, {
      path: 'certificates',
      data: { title: 'Certificates', breadcrumb: 'Certificates' },
      children: [{
        path: '',
        component: CertificateListComponent,
        data: { title: 'Certificates', breadcrumb: 'Certificates' },
      }, {
        path: 'import',
        component: CertificateImportComponent,
        data: { title: 'Import', breadcrumb: 'Import' },
      }, {
        path: 'internal',
        component: CertificateInternalComponent,
        data: { title: 'Internal', breadcrumb: 'Internal' },
      }, {
        path: 'csr',
        component: CertificateCSRComponent,
        data: { title: 'CSR', breadcrumb: 'CSR' },
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
