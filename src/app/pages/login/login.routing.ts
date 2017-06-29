import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {Login} from './login.component';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [ {path : '', component : Login} ];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
