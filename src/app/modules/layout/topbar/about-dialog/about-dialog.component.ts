import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { helptextAbout } from 'app/helptext/about';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { TruenasLogoComponent } from 'app/modules/layout/topbar/truenas-logo/truenas-logo.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SystemVersionPipe } from 'app/pages/dashboard/widgets/system/common/system-version.pipe';
import { AppState } from 'app/store';
import { selectIsEnterprise, selectSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-about-dialog',
  templateUrl: './about-dialog.component.html',
  styleUrls: ['./about-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatDialogContent,
    MatDialogActions,
    CopyrightLineComponent,
    MatButton,
    TranslateModule,
    TestDirective,
    TruenasLogoComponent,
    SystemVersionPipe,
    MatTooltip,
  ],
})
export class AboutDialogComponent {
  readonly helptext = helptextAbout;
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  readonly systemInfo = toSignal(this.store$.select(selectSystemInfo));

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    private store$: Store<AppState>,
  ) {}
}
