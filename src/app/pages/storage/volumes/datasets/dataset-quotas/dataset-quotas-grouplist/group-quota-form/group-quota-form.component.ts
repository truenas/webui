import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-quotas';
import { SetDatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { UserService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { map } from 'rxjs/operators';

@UntilDestroy()
@Component({
  templateUrl: './group-quota-form.component.html',
  styleUrls: ['./group-quota-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupQuotaFormComponent {
  isLoading = false;

  form = this.formBuilder.group({
    data_quota: [null as number],
    obj_quota: [null as number],
    system_entries: [[] as string[]],
    searched_entries: [[] as string[]],
  });

  readonly tooltips = {
    dataQuota: this.translate.instant(helptext.groups.data_quota.tooltip)
      + ' ' + this.translate.instant(helptext.field_accepts_tooltip),
    objectQuota: helptext.groups.obj_quota.tooltip,
    systemEntries: helptext.groups.system_select.tooltip,
    searchedEntries: helptext.groups.search.tooltip,
  };

  systemEntries$ = this.ws.call('group.query').pipe(
    map((groups) => {
      return groups.map((group) => {
        return {
          label: group.group,
          value: group.gid,
        };
      });
    }),
  );

  private datasetId: string;

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    public formatter: IxFormatterService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
    private userService: UserService,
    private slideIn: IxSlideInService,
  ) {}

  setDatasetId(datasetId: string): void {
    this.datasetId = datasetId;
  }

  onSubmit(): void {
    this.isLoading = true;

    const quotas = this.getQuotas();
    this.ws.call('pool.dataset.set_quota', [this.datasetId, quotas])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.isLoading = false;
          this.slideIn.close();
          this.cdr.markForCheck();
        },
        (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.handleWsFormError(error, this.form);
        },
      );
  }

  private getQuotas(): SetDatasetQuota[] {
    const quotas: SetDatasetQuota[] = [];
    const formValues = this.form.value;

    const users = new Set(formValues.system_entries);
    formValues.searched_entries.forEach((searchedEntry) => users.add(searchedEntry));

    users.forEach((user) => {
      if (formValues.data_quota > 0) {
        quotas.push({
          id: String(user),
          quota_type: DatasetQuotaType.Group,
          quota_value: formValues.data_quota,
        });
      }
      if (formValues.obj_quota > 0) {
        quotas.push({
          id: String(user),
          quota_type: DatasetQuotaType.GroupObj,
          quota_value: formValues.obj_quota,
        });
      }
    });

    return quotas;
  }
}
