import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-disk-health-card',
  templateUrl: './disk-health-card.component.html',
  styleUrls: ['./disk-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskHealthCardComponent {
  @Input() pool: Pool;
}
