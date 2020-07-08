import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import { SystemProcessesComponent } from './system-processes.component';

export const routes: Routes = [ {
  path: '',
  component: SystemProcessesComponent
} ];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
