import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AdvancedComponent } from './advanced/';
//import {GeneralComponent} from './general/';

import { GeneralComponent } from './general/general.component';
import { ConfigSaveComponent } from './general/config-save/config-save.component';
import { ConfigUploadComponent } from './general/config-upload/config-upload.component';
import { ConfigResetComponent } from './general/config-reset/config-reset.component';

export const routes: Routes = [
  // {path : '', component : GeneralComponent },
  // {path : '', component : AdvancedComponent }
  {
    path: '',
    data: { title: 'System' },
    children: [{
      path: 'general',
      data: { title: 'General', breadcrumb: 'General'},
      children: [{
        path: '',
        component: GeneralComponent,
        data: { title: 'General', breadcrumb: 'General'},
      },{
        path: 'config-save',
        component: ConfigSaveComponent,
        data: { title: 'Config Save', breadcrumb: 'Config Save' },
      },
      {
        path: 'config-upload',
        component: ConfigUploadComponent,
        data: { title: 'Config Upload', breadcrumb: 'Config Upload' },
      },
      {
        path: 'config-reset',
        component: ConfigResetComponent,
        data: { title: 'Config Reset', breadcrumb: 'Config Reset' },
      }]
    }]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
