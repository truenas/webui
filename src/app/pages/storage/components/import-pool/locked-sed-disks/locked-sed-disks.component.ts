import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { LockedSedDisk } from 'app/pages/storage/components/import-pool/utils/sed-disk.utils';

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
}
