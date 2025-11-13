import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { containerStatusLabels } from 'app/enums/container.enum';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-instance-status-cell',
  templateUrl: './instance-status-cell.component.html',
  styleUrls: ['./instance-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MapValuePipe],
  host: {
    '[class]': 'hostClasses()',
  },
})
export class InstanceStatusCellComponent {
  readonly instance = input.required<ContainerInstance>();

  protected hostClasses = computed(() => {
    return [
      this.status()?.toLowerCase() || 'unknown',
      'has-cell',
    ].join(' ');
  });

  status = computed(() => this.instance().status?.state);

  protected statusLabels = containerStatusLabels;
}
