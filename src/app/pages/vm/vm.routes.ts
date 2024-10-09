import { Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { DeviceListComponent } from 'app/pages/vm/devices/device-list/device-list/device-list.component';
import { VmListComponent } from 'app/pages/vm/vm-list.component';
import { VmSerialShellComponent } from 'app/pages/vm/vm-serial-shell/vm-serial-shell.component';

export const vmRoutes: Routes = [
  {
    path: '',
    data: { title: T('Virtual Machines'), breadcrumb: null },
    component: VmListComponent,
  },
  {
    path: ':pk/serial',
    component: VmSerialShellComponent,
    data: { title: T('VM Serial Shell'), breadcrumb: null },
  },
  {
    path: ':pk/devices',
    data: { title: T('Devices'), breadcrumb: null },
    component: DeviceListComponent,
  },
];
