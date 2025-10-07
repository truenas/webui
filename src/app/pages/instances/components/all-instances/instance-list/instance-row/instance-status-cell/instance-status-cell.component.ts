import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { virtualizationStatusLabels } from 'app/enums/virtualization.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-instance-status-cell',
  templateUrl: './instance-status-cell.component.html',
  styleUrls: ['./instance-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MapValuePipe],
})
export class InstanceStatusCellComponent {
  readonly instance = input.required<ContainerInstance>();

  @HostBinding('class') get hostClasses(): string[] {
    return [
      this.status()?.toLowerCase() || 'unknown',
      'has-cell',
    ];
  }

  status = computed(() => this.instance().status?.state);

  protected statusLabels = virtualizationStatusLabels;
}
