import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { nvmeOfNamespaceTypeLabels } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-namespace-description',
  templateUrl: './namespace-description.component.html',
  styleUrl: './namespace-description.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MapValuePipe,
    TranslateModule,
  ],
})
export class NamespaceDescriptionComponent {
  namespace = input.required<NvmeOfNamespace>();

  protected readonly typeLabels = nvmeOfNamespaceTypeLabels;
}
