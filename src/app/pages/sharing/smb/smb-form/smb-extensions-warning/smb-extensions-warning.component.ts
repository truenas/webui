import { ChangeDetectionStrategy, Component, DestroyRef, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnBannerActionDirective, TnBannerComponent, TnButtonComponent } from '@truenas/ui-components';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-smb-extensions-warning',
  styleUrls: ['./smb-extensions-warning.component.scss'],
  templateUrl: './smb-extensions-warning.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnBannerComponent,
    TnBannerActionDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class SmbExtensionsWarningComponent {
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  extensionsEnabled = output();

  protected enableExtensions(): void {
    this.api.call('smb.update', [{ aapl_extensions: true }]).pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.snackbar.success(
        this.translate.instant('Apple SMB2/3 protocol extension support has been enabled.'),
      );

      this.extensionsEnabled.emit();
    });
  }
}
