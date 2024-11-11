import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { LetDirective } from 'app/directives/app-let.directive';
import { helptextAbout } from 'app/helptext/about';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { CopyrightLineComponent } from 'app/modules/layout/copyright-line/copyright-line.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectIsEnterprise, selectSystemInfoState } from 'app/store/system-info/system-info.selectors';

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
    MapValuePipe,
    LetDirective,
    TestDirective,
    AsyncPipe,
  ],
})
export class AboutDialogComponent {
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  readonly systemVersion$ = this.store$.select(selectSystemInfoState).pipe(map((system) => system.systemInfo?.version));
  readonly helptext = helptextAbout;

  constructor(
    public dialogRef: MatDialogRef<AboutDialogComponent>,
    private store$: Store<AppState>,
  ) {}
}
