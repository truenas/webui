import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { ReplicationConfig } from 'app/interfaces/replication-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: 'replication-form.component.html',
  styleUrls: ['./replication-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationFormComponent implements OnInit {
  isFormLoading = false;
  form = this.fb.group({
    max_parallel_replication_tasks: [null as number],
  });

  readonly tooltips = {
    max_parallel_replication_tasks: helptextSystemAdvanced.max_parallel_replication_tasks_tooltip,
  };

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('replication.config.config')
      .pipe(untilDestroyed(this))
      .subscribe(
        (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
        },
        (error) => {
          this.isFormLoading = false;
          new EntityUtils().handleWsError(null, error, this.dialogService);
          this.cdr.markForCheck();
        },
      );
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
      max_parallel_replication_tasks: maxTasks > 0 ? maxTasks : null,
    };
    this.isFormLoading = true;
    this.ws.call('replication.config.update', [replicationConfigUpdate]).pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.cdr.markForCheck();
      this.slideInService.close();
      this.sysGeneralService.refreshSysGeneral();
    }, (res) => {
      this.isFormLoading = false;
      new EntityUtils().handleWsError(this, res);
      this.cdr.markForCheck();
    });
  }
}
