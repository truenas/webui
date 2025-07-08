import {
  ChangeDetectionStrategy, Component, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-smb-extensions-warning',
  templateUrl: './smb-extensions-warning.component.html',
  styleUrls: ['./smb-extensions-warning.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatButton,
    TranslateModule,
    TestDirective,
  ],
})
export class SmbExtensionsWarningComponent {
  extensionsEnabled = output();

  constructor(
    private api: ApiService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private loader: LoaderService,
  ) {}

  protected enableExtensions(): void {
    this.api.call('smb.update', [{ aapl_extensions: true }]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(
        this.translate.instant('Apple SMB2/3 protocol extension support has been enabled.'),
      );

      this.extensionsEnabled.emit();
    });
  }
}
