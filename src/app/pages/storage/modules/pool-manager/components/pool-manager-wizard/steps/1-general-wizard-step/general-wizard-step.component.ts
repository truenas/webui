import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, combineLatest,
} from 'rxjs';
import { startWith } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { forbiddenAsyncValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent implements OnInit {
  protected form = this.formBuilder.group({
    name: ['', Validators.required],
    encryption: [false],
    encryptionStandard: ['AES-256-GCM', Validators.required],
  });

  poolNames$ = this.ws.call('pool.query').pipe(map((pools) => pools.map((pool) => pool.name)));

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
  ) {}

  ngOnInit(): void {
    this.form.controls.name.addAsyncValidators(forbiddenAsyncValues(this.poolNames$));

    this.initEncryptionField();
    this.connectGeneralOptionsToStore();
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
      this.form.controls.name.valueChanges.pipe(startWith('')),
      this.form.controls.encryption.valueChanges.pipe(startWith(false)),
      this.form.controls.encryptionStandard.valueChanges.pipe(startWith('AES-256-GCM')),
    ]).pipe(untilDestroyed(this)).subscribe(([name, encryption, encryptionStandard]) => {
      this.store.setGeneralOptions({
        name,
        encryption: encryption ? encryptionStandard : null,
      });
    });
  }
}
