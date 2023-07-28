import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: 'replication-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationSettingsFormComponent implements OnInit {
  isFormLoading = false;
  form = this.fb.group({
    max_parallel_replication_tasks: [null as number],
  });

  readonly tooltips = {
    max_parallel_replication_tasks: helptextSystemAdvanced.max_parallel_replication_tasks_tooltip,
  };

  constructor(
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<ReplicationSettingsFormComponent>,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('replication.config.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
        },
        error: (error: WebsocketError) => {
          this.isFormLoading = false;
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      });
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
        this.slideInRef.close();
      },
      error: (error: WebsocketError) => {
        this.isFormLoading = false;
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.cdr.markForCheck();
      },
    });
  }
}
