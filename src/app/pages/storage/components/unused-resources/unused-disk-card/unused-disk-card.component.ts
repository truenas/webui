import {
  ChangeDetectionStrategy, Component, Input, output,
} from '@angular/core';
import { Role } from 'app/enums/role.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';

@Component({
  selector: 'ix-unused-disk-card',
  templateUrl: './unused-disk-card.component.html',
  styleUrls: ['./unused-disk-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnusedDiskCardComponent {
  @Input() pools: Pool[];
  @Input() title: string;
  @Input() disks: DetailsDisk[];

  readonly addToStorage = output();

  readonly requiredRoles = [Role.FullAdmin];

  onAddToStorage(): void {
    this.addToStorage.emit();
  }
}
