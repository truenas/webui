import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ReportsDashboard} from './reportsdashboard.component';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [ {
  path : '',
  pathMatch : 'full',
  component : ReportsDashboard,
} ];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
