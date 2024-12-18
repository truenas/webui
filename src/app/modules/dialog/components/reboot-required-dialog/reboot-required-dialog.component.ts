import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { FipsService } from 'app/services/fips.service';
import { AppState } from 'app/store';
import { selectOtherNodeRebootInfo, selectThisNodeRebootInfo } from 'app/store/reboot-info/reboot-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-reboot-required-dialog',
  templateUrl: './reboot-required-dialog.component.html',
  styleUrls: ['./reboot-required-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CdkScrollable,
    TranslateModule,
    ReactiveFormsModule,
    MatDialogModule,
    IxCheckboxComponent,
    MatButton,
  ],
})
export class RebootRequiredDialogComponent {
  thisNodeRebootReasons = toSignal(this.store$.select(selectThisNodeRebootInfo).pipe(
    map((info) => info?.reboot_required_reasons || []),
  ));

  otherNodeRebootReasons = toSignal(this.store$.select(selectOtherNodeRebootInfo).pipe(
    map((info) => info?.reboot_required_reasons || []),
  ));

  form = this.fb.group({
    confirm: [false, Validators.requiredTrue],
  });

  constructor(
    private store$: Store<AppState>,
    private fips: FipsService,
    private fb: FormBuilder,
  ) {}

  rebootLocalNode(): void {
    this.fips.restart();
  }

  rebootRemoteNode(): void {
    this.fips.restartRemote().pipe(untilDestroyed(this)).subscribe();
  }
}
