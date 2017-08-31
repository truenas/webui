import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ReportsDashboardComponent} from './reportsdashboard.component';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [ {
  path : '',
  pathMatch : 'full',
  component : ReportsDashboardComponent,
} ];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
