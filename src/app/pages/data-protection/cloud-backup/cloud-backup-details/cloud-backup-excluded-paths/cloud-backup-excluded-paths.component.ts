import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnTestIdDirective } from '@truenas/ui-components';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { normalizeTestIdString } from 'app/modules/test-id/normalize-test-id.utils';

@Component({
  selector: 'ix-cloud-backup-excluded-paths',
  templateUrl: './cloud-backup-excluded-paths.component.html',
  styleUrl: './cloud-backup-excluded-paths.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class CloudBackupExcludedPathsComponent {
  readonly backup = input.required<CloudBackup>();

  /**
   * A path is a runtime value, so it goes through the lodash normalizer the app's dynamic ids are
   * minted with rather than the library's kebab-caser, which does not split a letter→digit boundary.
   */
  protected excludedPathTestId(path: string): string {
    return normalizeTestIdString(path);
  }
}
