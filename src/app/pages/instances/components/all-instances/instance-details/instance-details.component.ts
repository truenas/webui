import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { ContainerType } from 'app/enums/container.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { instanceDetailsElements } from 'app/pages/instances/components/all-instances/instance-details/instance-details.elements';
import {
  InstanceDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  InstanceDisksComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import { InstanceNicsComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-nics/instance-nics.component';
import {
  InstanceToolsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-tools/instance-tools.component';

@Component({
  selector: 'ix-instance-details',
  templateUrl: './instance-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    InstanceDevicesComponent,
    InstanceGeneralInfoComponent,
    InstanceDisksComponent,
    InstanceToolsComponent,
    InstanceNicsComponent,
    UiSearchDirective,
  ],
})
export class InstanceDetailsComponent {
  instance = input.required<ContainerInstance>();

  protected readonly searchableElements = instanceDetailsElements;
  protected readonly ContainerType = ContainerType;
}
