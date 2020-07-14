import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import { GuideComponent } from './guide.component';

export const routes: Routes = [ {
  path: '',
  component: GuideComponent
} ];

export const routing: ModuleWithProviders<RouterModule> = RouterModule.forChild(routes);
