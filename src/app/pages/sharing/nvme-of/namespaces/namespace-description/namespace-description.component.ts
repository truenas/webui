import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { nvmeOfNamespaceTypeLabels } from 'app/enums/nvme-of.enum';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';

@Component({
  selector: 'ix-namespace-description',
  templateUrl: './namespace-description.component.html',
  styleUrl: './namespace-description.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MapValuePipe,
    TranslateModule,
    NgClass,
  ],
})
export class NamespaceDescriptionComponent {
  namespace = input.required<NamespaceChanges>();

  protected readonly typeLabels = nvmeOfNamespaceTypeLabels;
}
