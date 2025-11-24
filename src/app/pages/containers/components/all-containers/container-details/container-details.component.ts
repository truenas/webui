import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { ContainerType } from 'app/enums/container.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { containerDetailsElements } from 'app/pages/containers/components/all-containers/container-details/container-details.elements';
import {
  ContainerFilesystemDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-devices.component';
import {
  ContainerGeneralInfoComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-general-info/container-general-info.component';
import { ContainerNicDevicesComponent } from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/container-nic-devices.component';
import {
  ContainerToolsComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-tools/container-tools.component';
import {
  ContainerUsbDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-usb-devices/container-usb-devices.component';

@Component({
  selector: 'ix-container-details',
  templateUrl: './container-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ContainerUsbDevicesComponent,
    ContainerGeneralInfoComponent,
    ContainerFilesystemDevicesComponent,
    ContainerToolsComponent,
    ContainerNicDevicesComponent,
    UiSearchDirective,
  ],
})
export class ContainerDetailsComponent {
  container = input.required<ContainerInstance>();

  protected readonly searchableElements = containerDetailsElements;
  protected readonly ContainerType = ContainerType;
}
