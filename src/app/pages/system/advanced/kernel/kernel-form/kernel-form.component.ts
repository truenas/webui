import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, Inject,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { CHAINED_COMPONENT_REF, SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ChainedComponentRef } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: 'kernel-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KernelFormComponent implements OnInit {
  isFormLoading = false;
  form = this.fb.group({
    debugkernel: [false],
  });
  protected readonly Role = Role;
  readonly tooltips = {
    debugkernel: helptextSystemAdvanced.debugkernel_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    @Inject(CHAINED_COMPONENT_REF) private chainedRef: ChainedComponentRef,
    @Inject(SLIDE_IN_DATA) private debugkernel = false,
  ) {}

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
