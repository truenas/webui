import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { WebdavListComponent } from './webdav-list/';
import {WebdavFormComponent} from './webdav-form/';
// import {WebdavDeleteComponent} from './webdav-delete/';

export const routes: Routes = [
    { path: '', component: WebdavListComponent },
    { path: 'add', component: WebdavFormComponent },
    { path: 'edit/:pk', component: WebdavFormComponent },
    // { path: 'delete/:pk', component: WebdavDeleteComponent },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);