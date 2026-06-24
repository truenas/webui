import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
} from '@truenas/ui-components';
import { take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-nvidia-drivers-form',
  templateUrl: 'nvidia-drivers-form.component.html',
  styleUrls: ['./nvidia-drivers-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class NvidiaDriversFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected isFormLoading = signal(false);
  form = this.fb.nonNullable.group({
    nvidia: [false],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  ngOnInit(): void {
    this.store$.pipe(
      waitForAdvancedConfig,
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.form.patchValue({
        nvidia: config.nvidia,
      });
    });
  }

  protected onSubmit(): void {
    const values = this.form.value;
    this.isFormLoading.set(true);
    this.api.call('system.advanced.update', [{ nvidia: values.nvidia }]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
