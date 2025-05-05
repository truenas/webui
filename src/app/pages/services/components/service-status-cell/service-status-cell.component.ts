import {
  ChangeDetectionStrategy,
  Component, HostBinding,
  computed,
  input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { serviceStatusLabels } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-service-status-cell',
  templateUrl: './service-status-cell.component.html',
  styleUrls: ['./service-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MapValuePipe],
})
export class ServiceStatusCellComponent {
  readonly service = input.required<Service>();

  @HostBinding('class') get hostClasses(): string[] {
    return [
      this.status()?.toLowerCase(),
      'has-cell',
    ];
  }

  status = computed(() => this.service().state);

  protected statusLabels = serviceStatusLabels;
}
