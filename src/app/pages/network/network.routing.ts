import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {VlanFormComponent} from './vlans/vlan-form/';
import {VlanListComponent} from './vlans/vlan-list/';
import {LaggFormComponent} from './laggs/lagg-form/';
import {LaggListComponent} from './laggs/lagg-list/';
import {InterfacesFormComponent} from './interfaces/interfaces-form/';
import {InterfacesListComponent} from './interfaces/interfaces-list/';
import {ConfigurationComponent} from './configuration/';
import {StaticRouteFormComponent} from './staticroutes/staticroute-form/';
import {StaticRouteListComponent} from './staticroutes/staticroute-list/';

export const routes: Routes = [
  {
    path: '',
    data: {title: 'Network'},
    children: [
      {
        path : 'configuration', component : ConfigurationComponent,
        data: {title: 'Configuration', breadcrumb:'Configuration' }}, 
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
        data: {title:'Vlans', breadcrumb: 'Vlans'},
        children: [
          {path : '', component : VlanListComponent,
            data: {title:'Vlans', breadcrumb: 'Vlans'}},
          {path : 'add', component : VlanFormComponent,
            data: {title: 'Add', breadcrumb:'Add' }},
          {path : 'edit/:pk', component : VlanFormComponent,
            data: {title: 'Edit', breadcrumb:'Edit' }},
        ] 
      },
      {
        path : 'laggs',
        data: {title:'Laggs', breadcrumb:'Laggs' },
        children: [
          {path : '', component : LaggListComponent,
           data: {title:'Laggs', breadcrumb:'Laggs' }},
          {path : 'add', component : LaggFormComponent,
           data: {title: 'Add', breadcrumb:'Add' }},
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
