import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { virtualizationStatusLabels } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-instance-status-cell',
  templateUrl: './instance-status-cell.component.html',
  styleUrls: ['./instance-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MapValuePipe],
})
export class InstanceStatusCellComponent {
  readonly instance = input.required<VirtualizationInstance>();

  @HostBinding('class') get hostClasses(): string[] {
    return [
      this.status()?.toLowerCase(),
      'has-cell',
    ];
  }

  status = computed(() => this.instance().status);

  protected statusLabels = virtualizationStatusLabels;
}
