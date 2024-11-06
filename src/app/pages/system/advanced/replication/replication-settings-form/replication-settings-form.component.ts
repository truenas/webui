import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-replication-settings-form',
  templateUrl: 'replication-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeader2Component,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ReplicationSettingsFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.ReplicationTaskConfigWrite];

  isFormLoading = false;
  form = this.fb.group({
    max_parallel_replication_tasks: [null as number],
  });

  readonly tooltips = {
    max_parallel_replication_tasks: helptextSystemAdvanced.max_parallel_replication_tasks_tooltip,
  };

  private replicationConfig: ReplicationConfig;

  constructor(
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private chainedRef: ChainedRef<ReplicationConfig>,
  ) {
    this.replicationConfig = this.chainedRef.getData();
  }

  ngOnInit(): void {
    this.form.patchValue(this.replicationConfig);
  }

  setupForm(group: ReplicationConfig): void {
    this.form.patchValue({
      max_parallel_replication_tasks: group?.max_parallel_replication_tasks,
    });
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    const maxTasks = this.form.value.max_parallel_replication_tasks;
    const replicationConfigUpdate = {
      max_parallel_replication_tasks: maxTasks && maxTasks > 0 ? maxTasks : null,
    };
    this.isFormLoading = true;
    this.ws.call('replication.config.update', [replicationConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.chainedRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseError(error));
        this.cdr.markForCheck();
      },
    });
  }
}
