import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';

@Component({
  selector: 'ix-subsystem-details',
  standalone: true,
  templateUrl: './subsystem-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubsystemDetailsComponent {
  readonly subsystem = input.required<NvmeOfSubsystem>();
}
