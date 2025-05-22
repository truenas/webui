import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-port-description',
  templateUrl: './port-description.component.html',
  styleUrl: './port-description.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MapValuePipe,
    TranslateModule,
  ],
})
export class PortDescriptionComponent {
  port = input.required<NvmeOfPort>();

  protected typeLabels = nvmeOfTransportTypeLabels;

  protected description = computed(() => {
    const description = this.port().addr_traddr;
    if (this.port().addr_trsvcid) {
      return `${description}:${this.port().addr_trsvcid}`;
    }

    return description;
  });
}
