import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { of, Observable } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  DialogService, WebSocketService, AppLoaderService, SystemGeneralService,
} from 'app/services';
import { ModalService } from 'app/services/modal.service';

const poolFieldName = 'pool';

@UntilDestroy()
@Component({
  selector: 'app-system-dataset-pool',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class SystemDatasetPoolComponent implements FormConfiguration {
  isOneColumnForm = true;

  fieldSets = new FieldSets([
    {
      name: this.translate.instant('System Dataset Pool'),
      label: false,
      config: [
        {
          type: 'select',
          placeholder: this.translate.instant('Select Pool'),
          name: poolFieldName,
          options: [],
          required: true,
        },
      ],
    },
  ]);

  title = this.translate.instant('System Dataset Pool');

  private entityForm: EntityFormComponent;

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private modalService: ModalService,
    private sysGeneralService: SystemGeneralService,
  ) { }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.loadChoices();
    this.loadCurrentDatasetPool();
  }

  private loadChoices(): void {
    this.ws
      .call('systemdataset.pool_choices')
      .pipe(untilDestroyed(this))
      .subscribe((poolChoices) => {
        const poolField = this.fieldSets.config(poolFieldName) as FormSelectConfig;
        poolField.options = Object.entries(poolChoices)
          .map(([label, value]) => ({ label, value }));
      });
  }

  private loadCurrentDatasetPool(): void {
    this.ws.call('systemdataset.config').pipe(untilDestroyed(this)).subscribe((config) => {
      if (!config) {
        return;
      }

      const poolFormControl = this.entityForm.formGroup.controls[poolFieldName];
      poolFormControl.setValue(config.pool);
    });
  }

  customSubmit(formValues: { pool: string }): void {
    this.loader.open();

    of(formValues).pipe(
      switchMap(() => this.confirmSmbRestartIfNeeded()),
      filter(Boolean),
      switchMap(() => this.ws.job('systemdataset.update', [formValues])),
      untilDestroyed(this),
    ).subscribe({
      complete: () => {
        this.loader.close();
        this.entityForm.success = true;
        this.entityForm.formGroup.markAsPristine();
        this.modalService.close('slide-in-form');
        this.sysGeneralService.refreshSysGeneral();
      },
      error: (error) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, error);
      },
    });
  }

  /**
   * @return boolean True when saving can continue.
   */
  confirmSmbRestartIfNeeded(): Observable<boolean> {
    return this.ws.call('service.query').pipe(
      switchMap((services) => {
        const smbService = _.find(services, { service: ServiceName.Cifs });
        if (smbService.state === ServiceStatus.Running) {
          return this.dialogService.confirm({
            title: this.translate.instant('Restart SMB Service'),
            message: this.translate.instant(
              'The system dataset will be updated and the SMB service restarted. This will cause a temporary disruption of any active SMB connections.',
            ),
            hideCheckBox: false,
            buttonMsg: this.translate.instant('Continue'),
          });
        }

        return of(true);
      }),
    );
  }
}
