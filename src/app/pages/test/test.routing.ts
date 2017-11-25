import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TestPage } from './page/test-page.component';

export const routes: Routes = [
  {
    path: '',
    component : TestPage,
    data: {title: 'Test Page', breadcrumb:'Test Page'}
    //pathMatch : 'full'
  }
]
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
