import { Routes } from '@angular/router';

export const rootRoutes: Routes = [
  {
    path: '',
    redirectTo: 'harbor-assistant',
    pathMatch: 'full',
  },
  {
    path: 'harbor-assistant',
    loadChildren: () => import('app/pages/harbor-assistant/harbor-assistant.routes').then((module) => module.harborAssistantRoutes),
  },
  {
    path: '**',
    redirectTo: 'harbor-assistant',
    pathMatch: 'full',
  },
];
