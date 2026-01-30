import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';

@Component({
  selector: 'ix-subsystem-name-cell',
  templateUrl: './subsystem-name-cell.component.html',
  styleUrls: ['./subsystem-name-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatTooltipModule, TnIconComponent],
})
export class SubSystemNameCellComponent {
  subsystem = input.required<NvmeOfSubsystemDetails>();

  showWarning = computed(() => {
    const {
      ports, namespaces, hosts, allow_any_host: allowAnyHost,
    } = this.subsystem();

    return !namespaces.length || !ports.length || (!hosts.length && !allowAnyHost);
  });
}
