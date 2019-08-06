import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ReportsDashboardComponent} from './reportsdashboard.component';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [ 
  {
    path : '',
    pathMatch : 'full',
    //component : ReportsDashboardComponent,
    redirectTo:'cpu'
  },
  {
    path : 'cpu',
    pathMatch : 'full',
    data:{title:'CPU', breadcrumb:'CPU'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'disk',
    pathMatch : 'full',
    data:{title:'Disk', breadcrumb:'Disk'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'memory',
    pathMatch : 'full',
    data:{title:'Memory', breadcrumb:'Memory'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'network',
    pathMatch : 'full',
    data:{title:'Network', breadcrumb:'Network'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'nfs',
    pathMatch : 'full',
    data:{title:'NFS', breadcrumb:'NFS'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'partition',
    pathMatch : 'full',
    data:{title:'Partition', breadcrumb:'Partition'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'system',
    pathMatch : 'full',
    data:{title:'System', breadcrumb:'System'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'target',
    pathMatch : 'full',
    data:{title:'Target', breadcrumb:'Target'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'ups',
    pathMatch : 'full',
    data:{title:'UPS', breadcrumb:'UPS'},
    component : ReportsDashboardComponent,
  },
  {
    path : 'zfs',
    pathMatch : 'full',
    data:{title:'ZFS', breadcrumb:'ZFS'},
    component : ReportsDashboardComponent,
  },
  //{ path: '**', redirectTo: 'cpu', pathMatch: 'full' },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
