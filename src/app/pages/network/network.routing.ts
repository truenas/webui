import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {InterfacesFormComponent} from './interfaces/interfaces-form/';
import {InterfacesListComponent} from './interfaces/interfaces-list/';
import {ConfigurationComponent} from './configuration/';
import {StaticRouteFormComponent} from './staticroutes/staticroute-form/';
import {StaticRouteListComponent} from './staticroutes/staticroute-list/';
import {IPMIComponent} from './ipmi/';
import { NetworkSummaryComponent } from './networksummary/networksummary.component';
import { EntityDashboardComponent } from '../common/entity/entity-dashboard/entity-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    data: {title: 'Network'},
    children: [
      {
        path: '',
        component: EntityDashboardComponent,
      },
      {
        path : 'configuration', component : ConfigurationComponent,
        data: {title: 'Global Configuration', breadcrumb:'Global Configuration', icon: 'settings' }
      },
      {
          path : 'ipmi', component : IPMIComponent,
          data: {title: 'IPMI', breadcrumb:'IPMI', icon: 'settings' }
      },
      {
        path : 'interfaces',
        data: {title: 'Interfaces', breadcrumb:'Interfaces', icon: 'web_asset' },
        children: [
          {
            path : '', component : InterfacesListComponent,
            data: {title: 'Interfaces', breadcrumb:'Interfaces' }},
          {
            path : 'add', component : InterfacesFormComponent,
            data: {title: 'Add', breadcrumb:'Add' }},
          {
            path : 'edit/:pk', component : InterfacesFormComponent,
            data: {title: 'Edit', breadcrumb:'Edit' }},
        ],
      },
      {
        path: 'summary',
        data: { title: 'Network Summay', breadcrumb: 'Network Summay', icon: 'view_headline' },
        component: NetworkSummaryComponent,
      },
      {
        path : 'staticroutes',
        data: {title: 'Static Routes', breadcrumb:'Static Routes', icon: 'swap_calls'},
        children: [
          {
            path : '', component : StaticRouteListComponent,
            data: {title: 'Static Routes', breadcrumb:'Static Routes' }},
          {
            path : 'add', component : StaticRouteFormComponent,
            data: {title: 'Add', breadcrumb:'Add' }},
          {
            path : 'edit/:pk', component : StaticRouteFormComponent,
            data: {title: 'Edit', breadcrumb:'Edit' }},
        ]
      }
    ]
  }
];
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
