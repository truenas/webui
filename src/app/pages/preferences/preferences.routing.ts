import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreferencesPage } from './page/preferences.component';
import { CustomThemeComponent } from './page/forms/customtheme/customtheme.component';

export const routes: Routes = [
  {
    path: '',
    component : PreferencesPage,
    data: {title: 'Preferences', breadcrumb:'Preferences'},
    pathMatch : 'full'
  },
  {
    path: 'create-theme',
    component : CustomThemeComponent,
    data: {title: 'Create New Theme', breadcrumb:'Create New Theme'},
    pathMatch : 'full'
  }
]
export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
