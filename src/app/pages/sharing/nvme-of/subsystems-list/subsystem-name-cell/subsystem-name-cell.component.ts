import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NvmeOfSubsystemDetails } from 'app/pages/sharing/nvme-of/services/nvme-of-subsystem-details.interface';

@Component({
  selector: 'ix-subsystem-name-cell',
  templateUrl: './subsystem-name-cell.component.html',
  styleUrls: ['./subsystem-name-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatTooltipModule, IxIconComponent],
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
