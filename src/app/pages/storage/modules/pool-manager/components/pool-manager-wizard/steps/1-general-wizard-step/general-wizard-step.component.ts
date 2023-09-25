import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, combineLatest,
} from 'rxjs';
import { startWith } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Pool } from 'app/interfaces/pool.interface';
import { forbiddenAsyncValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { PoolWizardNameValidationService } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/steps/1-general-wizard-step/pool-wizard-name-validation.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

const defaultEncryptionStandard = 'AES-256-GCM';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent implements OnInit, OnChanges {
  @Input() isAddingVdevs = false;
  @Input() pool: Pool;
  @Input() isStepActive: boolean;

  form = this.formBuilder.group({
    name: ['', Validators.required],
    encryption: [false],
    encryptionStandard: [defaultEncryptionStandard, Validators.required],
  });

  isLoading$ = this.store.isLoading$;
  poolNames$ = this.ws.call('pool.query').pipe(map((pools) => pools.map((pool) => pool.name)));
  private readonly oldNameForbiddenValidator = forbiddenAsyncValues(this.poolNames$);

  readonly encryptionAlgorithmOptions$ = this.ws
    .call('pool.dataset.encryption_algorithm_choices')
    .pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialog: DialogService,
    private translate: TranslateService,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
    private poolWizardNameValidationService: PoolWizardNameValidationService,
  ) { }

  ngOnChanges(): void {
    if (this.isAddingVdevs) {
      this.form.controls.encryption.disable();
      this.form.controls.encryptionStandard.disable();
      this.form.controls.name.setValue(this.pool?.name || '');
      this.form.controls.name.removeAsyncValidators(this.oldNameForbiddenValidator);
      this.form.controls.name.updateValueAndValidity();
    } else {
      this.form.controls.name.addAsyncValidators([
        this.oldNameForbiddenValidator,
        this.poolWizardNameValidationService.validatePoolName,
      ]);
      this.form.controls.name.updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    this.initEncryptionField();
    this.connectGeneralOptionsToStore();

    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.form.reset({
        encryptionStandard: defaultEncryptionStandard,
      });
    });
  }

  private initEncryptionField(): void {
    this.form.controls.encryption.valueChanges.pipe(untilDestroyed(this)).subscribe((isEncrypted) => {
      if (!isEncrypted) {
        return;
      }

      this.dialog
        .confirm({
          title: this.translate.instant('Warning'),
          message: helptext.manager_encryption_message,
          buttonText: this.translate.instant('I Understand'),
        })
        .pipe(untilDestroyed(this))
        .subscribe((confirmed) => {
          if (!confirmed) {
            this.form.controls.encryption.setValue(false);
          }
          this.cdr.markForCheck();
        });
    });
  }

  private connectGeneralOptionsToStore(): void {
    combineLatest([
      this.form.controls.name.statusChanges,
      this.form.controls.name.valueChanges.pipe(startWith('')),
      this.form.controls.encryption.valueChanges.pipe(startWith(false)),
      this.form.controls.encryptionStandard.valueChanges.pipe(startWith('AES-256-GCM')),
    ]).pipe(untilDestroyed(this)).subscribe(([, name, encryption, encryptionStandard]) => {
      this.store.setGeneralOptions({
        name,
        nameErrors: this.form.controls.name.errors,
        encryption: encryption ? encryptionStandard : null,
      });
    });
  }
}
