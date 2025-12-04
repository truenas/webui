import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface LockedSedDisk {
  name: string;
  model: string;
  serial: string;
  size: number;
}

@Component({
  selector: 'ix-locked-sed-disks',
  templateUrl: './locked-sed-disks.component.html',
  styleUrls: ['./locked-sed-disks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class LockedSedDisksComponent {
  readonly lockedDisks = input.required<LockedSedDisk[]>();

  readonly skip = output();
  readonly unlock = output();

  protected onSkip(): void {
    this.skip.emit();
  }

  protected onUnlock(): void {
    this.unlock.emit();
  }

  static filterLockedSedDisks(disks: DetailsDisk[]): LockedSedDisk[] {
    return disks
      .filter((disk) => disk.sed_status === SedStatus.Locked)
      .map((disk) => ({
        name: disk.name,
        model: disk.model || '',
        serial: disk.serial || '',
        size: disk.size,
      }));
  }
}
