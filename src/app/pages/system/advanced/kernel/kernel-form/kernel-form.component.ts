import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppsState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  selector: 'ix-kernel-form',
  templateUrl: 'kernel-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KernelFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isFormLoading = false;
  form = this.fb.group({
    debugkernel: [false],
  });

  readonly tooltips = {
    debugkernel: helptextSystemAdvanced.debugkernel_tooltip,
  };

  private debugkernel = false;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private store$: Store<AppsState>,
    private chainedRef: ChainedRef<boolean>,
  ) {
    if (chainedRef.getData()) {
      this.debugkernel = true;
    }
  }

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.form.patchValue({
      debugkernel: this.debugkernel,
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const values = this.form.value;
    const commonBody = {
      debugkernel: values.debugkernel,
    };
    this.isFormLoading = true;
    this.ws.call('system.advanced.update', [commonBody]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.cdr.markForCheck();
        this.chainedRef.close({ response: true, error: null });
        this.store$.dispatch(advancedConfigUpdated());
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
        this.cdr.markForCheck();
      },
    });
  }
}
