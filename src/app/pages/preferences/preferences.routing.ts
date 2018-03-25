import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PreferencesPage } from './page/preferences.component';
import { CustomThemeComponent } from './page/forms/customtheme/customtheme.component';

export const routes: Routes = [
  {
    path: '',
    component : PreferencesPage,
    data: {title: 'UI Preferences', breadcrumb:'UI-Preferences'},
    pathMatch : 'full'
  },
  {
    path: 'create-theme',
    component : CustomThemeComponent,
    data: {title: 'Create Custom Theme', breadcrumb:'Create-Theme'},
    pathMatch : 'full'
  }
]
export const routing: ModuleWithProviders = RouterModule.forChild(routes);
