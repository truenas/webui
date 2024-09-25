import { CdkScrollable } from '@angular/cdk/scrolling';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { LetDirective } from 'app/directives/app-let.directive';
import { RebootRequiredReasons } from 'app/interfaces/reboot-info.interface';
import { AppsState } from 'app/store';
import { selectOtherNodeInfo, selectThisNodeInfo } from 'app/store/reboot-info/reboot-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-reboot-dialog',
  templateUrl: './reboot-dialog.component.html',
  styleUrls: ['./reboot-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CdkScrollable,
    MatDialogContent,
    MatDialogTitle,
    TranslateModule,
    AsyncPipe,
    LetDirective,
    NgTemplateOutlet,
  ],
})
export class RebootDialogComponent {
  thisNodeInfo$ = this.store$.select(selectThisNodeInfo);
  otherNodeInfo$ = this.store$.select(selectOtherNodeInfo);

  constructor(private store$: Store<AppsState>) {}

  typeReasons(reasons: unknown): RebootRequiredReasons[] {
    return reasons as RebootRequiredReasons[];
  }
}
