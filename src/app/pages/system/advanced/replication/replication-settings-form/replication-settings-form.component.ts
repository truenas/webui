import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { elements } from 'app/pages/system/advanced/replication/replication-settings-form/replication-settings-form.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: 'replication-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationSettingsFormComponent implements OnInit {
  protected requiredRoles = [Role.ReplicationTaskConfigWrite];
  protected readonly searchElements = elements;

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
