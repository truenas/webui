import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SmbLockInfo } from 'app/interfaces/smb-status.interface';

@Component({
  selector: 'ix-smb-open-files',
  templateUrl: './smb-open-files.component.html',
  styleUrls: ['./smb-open-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbOpenFilesComponent {
  @Input() lock: SmbLockInfo;
}
