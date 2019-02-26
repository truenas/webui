import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {VlanFormComponent} from './vlans/vlan-form/';
import {VlanListComponent} from './vlans/vlan-list/';
import {LaggFormComponent} from './laggs/lagg-form/';
import {LaggListComponent} from './laggs/lagg-list/';
import {LaggMembersFormComponent} from './laggs/members/members-form';
import {LaggMembersListComponent} from './laggs/members/members-list';
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
        path : 'vlans',
        data: {title:'VLANs', breadcrumb: 'VLANs', icon: 'device_hub'},
        children: [
          {path : '', component : VlanListComponent,
            data: {title:'VLANs', breadcrumb: 'VLANs'}},
          {path : 'add', component : VlanFormComponent,
            data: {title: 'Add', breadcrumb:'Add' }},
          {path : 'edit/:pk', component : VlanFormComponent,
            data: {title: 'Edit', breadcrumb:'Edit' }},
        ] 
      },
      {
        path : 'laggs',
        data: {title:'Link Aggregations', breadcrumb:'Link Aggregations', icon: 'device_hub' },
        children: [
          {path : '', component : LaggListComponent,
           data: {title:'Link Aggregations', breadcrumb:'Link Aggregations' }},
          {path : 'add', component : LaggFormComponent,
           data: {title: 'Add', breadcrumb:'Add' }},
          {
            path : ':pk/members',
            data: {title:'Members', breadcrumb: 'Members'},
            children: [
              {path : '', component : LaggMembersListComponent,
               data: {title:'Members', breadcrumb: 'Members'}},
              {path : 'add', component : LaggMembersFormComponent,
               data: {title: 'Add', breadcrumb:'Add' }},
              {path : ':id/edit/:nic', component : LaggMembersFormComponent,
               data: {title: 'Edit', breadcrumb:'Edit' }},
            ] 
          }
        ]
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
