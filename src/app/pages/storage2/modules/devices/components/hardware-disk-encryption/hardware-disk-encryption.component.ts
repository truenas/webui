import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { VDev } from 'app/interfaces/storage.interface';

@Component({
  selector: 'ix-hardware-disk-encryption',
  templateUrl: './hardware-disk-encryption.component.html',
  styleUrls: ['./hardware-disk-encryption.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HardwareDiskEncryptionComponent {
  @Input() disk: VDev;
}
