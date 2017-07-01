import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {PageNotFoundComponent} from './page-not-found.component';

// noinspection TypeScriptValidateTypes
export const routes: Routes =
    [ {path : '', component : PageNotFoundComponent} ];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
