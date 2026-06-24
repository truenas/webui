import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-replication-settings-form',
  templateUrl: 'replication-settings-form.component.html',
  styleUrls: ['./replication-settings-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class ReplicationSettingsFormComponent extends SidePanelForm implements OnInit {
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.ReplicationTaskConfigWrite];
  protected readonly InputType = InputType;

  protected isFormLoading = signal(false);
  form = this.fb.group({
    max_parallel_replication_tasks: [null as number | null],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly tooltips = {
    max_parallel_replication_tasks: helptextSystemAdvanced.maxParallelReplicationTasksTooltip,
  };

  ngOnInit(): void {
    this.api.call('replication.config.config').pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.form.patchValue({
        max_parallel_replication_tasks: config.max_parallel_replication_tasks,
      });
    });
  }

  protected onSubmit(): void {
    const maxTasks = this.form.value.max_parallel_replication_tasks;
    const replicationConfigUpdate = {
      max_parallel_replication_tasks: maxTasks && maxTasks > 0 ? maxTasks : null,
    };
    this.isFormLoading.set(true);
    this.api.call('replication.config.update', [replicationConfigUpdate]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.isFormLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
