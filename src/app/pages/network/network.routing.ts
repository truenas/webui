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
import {IPMIComponent} from './ipmi/'

export const routes: Routes = [
  {
    path: '',
    data: {title: 'Network'},
    children: [
      {
        path : 'configuration', component : ConfigurationComponent,
        data: {title: 'Configuration', breadcrumb:'Configuration' }},
        {
          path : 'ipmi', component : IPMIComponent,
          data: {title: 'IPMI', breadcrumb:'IPMI' }}, 
      {
        path : 'interfaces',
        data: {title: 'Interfaces', breadcrumb:'Interfaces' },
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
        data: {title:'VLANs', breadcrumb: 'VLANs'},
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
        data: {title:'Link Aggregations', breadcrumb:'Link Aggregations' },
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
        path : 'staticroutes',
        data: {title: 'Static Routes', breadcrumb:'Static Routes'},
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
