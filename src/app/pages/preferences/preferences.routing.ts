import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreferencesPage } from './page/preferences.component';


export const routes: Routes = [
  {
    path: '',
    component : PreferencesPage,
    data: {title: 'Preferences', breadcrumb:'Preferences'},
    pathMatch : 'full'
  },
]
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
