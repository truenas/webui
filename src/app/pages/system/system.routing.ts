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
        {
          path: 'edit/:pk',
          component: NTPServerEditComponent,
          data: { title: 'Edit', breadcrumb: 'Edit' },
        }
      ]
    },]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
