import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

//import {GeneralComponent} from './general/';

import { GeneralComponent } from './general/general.component';
import { ConfigSaveComponent } from './general/config-save/config-save.component';
import { ConfigUploadComponent } from './general/config-upload/config-upload.component';
import { ConfigResetComponent } from './general/config-reset/config-reset.component';
import { AdvancedComponent } from './advanced/';
import { BootEnvironmentCloneComponent } from './bootenv/bootenv-clone/';
import { BootEnvironmentRenameComponent } from './bootenv/bootenv-rename/';
import { BootEnvironmentListComponent } from './bootenv/bootenv-list/';
import { TunableFormComponent } from './tunable/tunable-form/';
import { TunableListComponent } from './tunable/tunable-list/';
import { UpdateComponent } from './update/';
import { NTPServerAddComponent } from './ntpservers/ntpserver-add/';
import { NTPServerEditComponent } from './ntpservers/ntpserver-edit/';
import { NTPServerListComponent } from './ntpservers/ntpserver-list/';
import { AlertServiceListComponent } from './alertservice/alertservice-list/';
import { CloudCredentialsGCSComponent } from './CloudCredentials/CloudCredentials-gcs/';
import { CloudCredentialsB2Component } from './CloudCredentials/CloudCredentials-B2/';
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
import { AlertServiceEditAWSComponent } from 'app/pages/system/alertservice/alertservice-edit-aws/alertservice-edit-aws.component';
import { AlertServiceAddAWSComponent } from 'app/pages/system/alertservice/alertservice-add-aws/alertservice-add-aws.component';
import { AlertServiceAddHipchatComponent } from 'app/pages/system/alertservice/alertservice-add-hipchat/alertservice-add-hipchat.component';
import { AlertServiceEditHipchatComponent } from 'app/pages/system/alertservice/alertservice-edit-hipchat/alertservice-edit-hipchat.component';
import { AlertServiceAddInfluxdbComponent } from 'app/pages/system/alertservice/alertservice-add-influxdb/alertservice-add-influxdb.component';
import { AlertServiceEditInfluxdbComponent } from 'app/pages/system/alertservice/alertservice-edit-influxdb/alertservice-edit-influxdb.component';
import { AlertServiceAddMattermostComponent } from 'app/pages/system/alertservice/alertservice-add-mattermost';
import { AlertServiceEditMattermostComponent } from 'app/pages/system/alertservice/alertservice-edit-mattermost';
import { AlertServiceEditVictoropsComponent } from 'app/pages/system/alertservice/alertservice-edit-victorops';
import { AlertServiceAddVictoropsComponent } from 'app/pages/system/alertservice/alertservice-add-victorops';
import { AlertServiceEditSlackComponent } from 'app/pages/system/alertservice/alertservice-edit-slack';
import { AlertServiceAddSlackComponent } from 'app/pages/system/alertservice/alertservice-add-slack';
import { AlertServiceEditPagerdutyComponent } from 'app/pages/system/alertservice/alertservice-edit-pagerduty';
import { AlertServiceAddPagerdutyComponent } from 'app/pages/system/alertservice/alertservice-add-pagerduty';
import { AlertServiceEditOpsgenieComponent } from 'app/pages/system/alertservice/alertservice-edit-opsgenie';
import { AlertServiceAddOpsgenieComponent } from 'app/pages/system/alertservice/alertservice-add-opsgenie';

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
      },
      {
        path: 'rename/:pk',
        component: BootEnvironmentRenameComponent,
        data: { title: 'Rename', breadcrumb: 'Rename' },
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
          path: 'add-aws',
          component: AlertServiceAddAWSComponent,
          data: { title: 'Add AWSSNS', breadcrumb: 'Add AWS' },
        },{
          path: 'edit-aws/:pk',
          component: AlertServiceEditAWSComponent,
          data: { title: 'Edit AWSSNS', breadcrumb: 'Edit AWS' },
        },{
          path: 'add-hipchat',
          component: AlertServiceAddHipchatComponent,
          data: { title: 'Add Hipchat', breadcrumb: 'Add Hipchat' },
        },{
          path: 'edit-hipchat/:pk',
          component: AlertServiceEditHipchatComponent,
          data: { title: 'Edit Hipchat', breadcrumb: 'Edit Hipchat' },
        },{
          path: 'add-influxdb',
          component: AlertServiceAddInfluxdbComponent,
          data: { title: 'Add Influxdb', breadcrumb: 'Add Influxdb' },
        },{
          path: 'edit-influxdb/:pk',
          component: AlertServiceEditInfluxdbComponent,
          data: { title: 'Edit Influxdb', breadcrumb: 'Edit Influxdb' },
        },{
          path: 'add-mattermost',
          component: AlertServiceAddMattermostComponent,
          data: { title: 'Add Mattermost', breadcrumb: 'Add Mattermost' },
        },{
          path: 'edit-mattermost/:pk',
          component: AlertServiceEditMattermostComponent,
          data: { title: 'Edit Mattermost', breadcrumb: 'Edit Mattermost' },
        },{
          path: 'add-opsgenie',
          component: AlertServiceAddOpsgenieComponent,
          data: { title: 'Add Mattermost', breadcrumb: 'Add OpsGenie' },
        },{
          path: 'edit-opsgenie/:pk',
          component: AlertServiceEditOpsgenieComponent,
          data: { title: 'Edit Mattermost', breadcrumb: 'Edit OpsGenie' },
        },{
          path: 'add-pagerduty',
          component: AlertServiceAddPagerdutyComponent,
          data: { title: 'Add Mattermost', breadcrumb: 'Add PagerDuty' },
        },{
          path: 'edit-pagerduty/:pk',
          component: AlertServiceEditPagerdutyComponent,
          data: { title: 'Edit Mattermost', breadcrumb: 'Edit PagerDuty' },
        },{
          path: 'add-slack',
          component: AlertServiceAddSlackComponent,
          data: { title: 'Add Mattermost', breadcrumb: 'Add Slack' },
        },{
          path: 'edit-slack/:pk',
          component: AlertServiceEditSlackComponent,
          data: { title: 'Edit Mattermost', breadcrumb: 'Edit Slack' },
        },{
          path: 'add-victorops',
          component: AlertServiceAddVictoropsComponent,
          data: { title: 'Add Mattermost', breadcrumb: 'Add VictOps' },
        },{
          path: 'edit-victorops/:pk',
          component: AlertServiceEditVictoropsComponent,
          data: { title: 'Edit Mattermost', breadcrumb: 'Edit VictorOps' },
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
