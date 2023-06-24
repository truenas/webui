import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  map, combineLatest, timer,
} from 'rxjs';
import { startWith, switchMap, tap } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { forbiddenAsyncValues } from 'app/modules/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { DialogService, WebSocketService } from 'app/services';

const defaultEncryptionStandard = 'AES-256-GCM';

@UntilDestroy()
@Component({
  selector: 'ix-general-wizard-step',
  templateUrl: './general-wizard-step.component.html',
  styleUrls: ['./general-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralWizardStepComponent implements OnInit, OnChanges {
  @Input() isStepActive: boolean;
  @Output() stepStatusValidityChanged = new EventEmitter<boolean>();

  form = this.formBuilder.group({
    name: ['', Validators.required],
    encryption: [false],
    encryptionStandard: [defaultEncryptionStandard, Validators.required],
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

    this.form.statusChanges.pipe(
      switchMap(() => timer(0)),
      tap(() => this.stepStatusValidityChanged.emit(this.form.valid)),
    ).pipe(untilDestroyed(this)).subscribe();

    this.stepStatusValidityChanged.emit(this.form.valid);

    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.form.reset({
        encryptionStandard: defaultEncryptionStandard,
      });
    });
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isStepActive.currentValue && !changes.isStepActive.previousValue) {
      this.emitStepValidityStatus();
    }
  }

  private emitStepValidityStatus(): void {
    this.stepStatusValidityChanged.emit(this.form.valid);
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
