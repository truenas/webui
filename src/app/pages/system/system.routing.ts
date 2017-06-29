import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AdvancedComponent} from './advanced/';
import {EmailComponent} from './email/';
import {
  ConfigResetComponent,
  ConfigSaveComponent,
  ConfigUploadComponent,
  GeneralComponent
} from './general/';
import {UpdateComponent} from './update/';

export const routes: Routes = [
  {path : 'general', component : GeneralComponent},
  {path : 'general/config-save', component : ConfigSaveComponent},
  {path : 'general/config-upload', component : ConfigUploadComponent},
  {path : 'general/config-reset', component : ConfigResetComponent},
  {path : 'email', component : EmailComponent},
  {path : 'advanced', component : AdvancedComponent},
  {path : 'update', component : UpdateComponent},
  {
    path : 'ca',
    loadChildren : 'app/pages/system/ca/ca.module#CertificateAuthorityModule'
  },
  {
    path : 'certificates',
    loadChildren :
        'app/pages/system/certificates/certificate.module#CertificateModule'
  },
  {
    path : 'tunable',
    loadChildren : 'app/pages/system/tunable/tunable.module#TunableModule'
  },
  {
    path : 'ntpservers',
    loadChildren :
        'app/pages/system/ntpservers/ntpservers.module#NTPServersModule'
  },
  {
    path : 'bootenv',
    loadChildren :
        'app/pages/system/bootenv/bootenv.module#BootEnvironmentsModule'
  },
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
