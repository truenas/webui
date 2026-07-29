import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { containerStatusLabels } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-container-status-cell',
  templateUrl: './container-status-cell.component.html',
  styleUrls: ['./container-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MapValuePipe],
  host: {
    '[class]': 'hostClasses()',
  },
})
export class ContainerStatusCellComponent {
  readonly container = input.required<Container>();

  protected hostClasses = computed(() => {
    return [
      this.status()?.toLowerCase() || 'unknown',
      'has-cell',
    ].join(' ');
  });

  status = computed(() => this.container().status?.state);

  protected statusLabels = containerStatusLabels;
}
