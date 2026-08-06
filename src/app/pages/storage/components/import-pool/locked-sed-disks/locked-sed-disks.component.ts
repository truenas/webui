import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnIconComponent } from '@truenas/ui-components';
import { LockedSedDisk } from 'app/pages/storage/components/import-pool/utils/sed-disk.utils';

@Component({
  selector: 'ix-locked-sed-disks',
  templateUrl: './locked-sed-disks.component.html',
  styleUrls: ['./locked-sed-disks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TnButtonComponent,
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
}
