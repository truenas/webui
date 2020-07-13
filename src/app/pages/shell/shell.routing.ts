import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import { ShellComponent } from './shell.component';

export const routes: Routes = [ {
  path: '',
  component: ShellComponent
} ];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
