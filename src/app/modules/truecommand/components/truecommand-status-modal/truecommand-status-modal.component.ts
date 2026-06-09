import { DIALOG_DATA } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnIconComponent,
} from '@truenas/ui-components';
import { TrueCommandStatus } from 'app/enums/true-command-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import { TrueCommandConfig } from 'app/interfaces/true-command-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TruecommandButtonComponent } from 'app/modules/truecommand/truecommand-button.component';

@Component({
  selector: 'ix-truecommand-status-modal',
  templateUrl: './truecommand-status-modal.component.html',
  styleUrls: ['./truecommand-status-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnIconComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class TruecommandStatusModalComponent {
  data = inject<{
    parent: TruecommandButtonComponent;
    data: TrueCommandConfig;
  }>(DIALOG_DATA);

  private window = inject<Window>(WINDOW);
  private dialogService = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  parent = this.data.parent;
  tc = this.data.data;

  readonly TrueCommandStatus = TrueCommandStatus;

  goToTrueCommand(): void {
    this.dialogService.generalDialog({
      title: helptextTopbar.tcDialog.title,
      message: helptextTopbar.tcDialog.message,
      is_html: true,
      confirmBtnMsg: helptextTopbar.tcDialog.confirmBtnMsg,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (confirmed) {
        this.window.open(this.tc.remote_url);
      }
    });
  }

  update(data: TrueCommandConfig): void {
    this.tc = data;
    this.cdr.detectChanges();
  }
}
