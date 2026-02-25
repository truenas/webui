import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogTitle, MatDialogActions } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { GiB } from 'app/constants/bytes.constant';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-about-nas-dialog',
  templateUrl: './about-nas-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    MatDialogActions,
    WithLoadingStateDirective,
  ],
  providers: [WidgetResourcesService],
})
export class AboutNasDialog implements OnInit {
  private dialogRef = inject<MatDialogRef<AboutNasDialog>>(MatDialogRef);
  private store$ = inject<Store<AppState>>(Store);
  private resources = inject(WidgetResourcesService);
  cpuModel$ = this.resources.cpuModel$;
  private destroyRef = inject(DestroyRef);

  systemInfo: SystemInfoInSupport;

  ngOnInit(): void {
    this.store$.pipe(waitForSystemInfo, takeUntilDestroyed(this.destroyRef)).subscribe((systemInfo) => {
      this.systemInfo = { ...systemInfo };
      this.systemInfo.memory = (systemInfo.physmem / GiB).toFixed(0) + ' GiB';
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
