import {ModuleWithProviders} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

export const routes: Routes = [
  {path : '', redirectTo : 'pages', pathMatch : 'full'},
  {path : '**', redirectTo : 'pageNotFound'},
];

export const routing: ModuleWithProviders =
    RouterModule.forRoot(routes, {useHash : true});
