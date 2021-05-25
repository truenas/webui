import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { ModalService } from 'app/services/modal.service';
import { of, Subscription } from 'rxjs';
import {
  DialogService, WebSocketService, AppLoaderService, SystemGeneralService,
} from 'app/services';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import _ from 'lodash';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Observable } from 'rxjs/Observable';
import { filter, switchMap } from 'rxjs/operators';

const poolFieldName = 'pool';

@Component({
  selector: 'app-system-dataset-pool',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [],
})
export class SystemDatasetPoolComponent implements FormConfiguration, OnDestroy {
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
  private poolChoicesSubscription: Subscription;
  private systemDatasetConfigSubscription: Subscription;

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

  ngOnDestroy(): void {
    this.poolChoicesSubscription?.unsubscribe();
    this.systemDatasetConfigSubscription?.unsubscribe();
  }

  private loadChoices(): void {
    this.poolChoicesSubscription = this.ws
      .call('systemdataset.pool_choices')
      .subscribe((poolChoices) => {
        const poolField = this.fieldSets.config(poolFieldName);
        poolField.options = Object.entries(poolChoices)
          .map(([label, value]) => ({ label, value }));
      });
  }

  private loadCurrentDatasetPool(): void {
    this.systemDatasetConfigSubscription = this.ws.call('systemdataset.config').subscribe((config) => {
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
