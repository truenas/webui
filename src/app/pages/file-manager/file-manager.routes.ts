import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const fileManagerRoutes: Routes = [
    {
        path: '',
        loadComponent: () => import('./file-manager.component').then((module) => module.FileManagerComponent),
        data: { title: T('File Manager'), breadcrumb: T('File Manager') },
    },
];
