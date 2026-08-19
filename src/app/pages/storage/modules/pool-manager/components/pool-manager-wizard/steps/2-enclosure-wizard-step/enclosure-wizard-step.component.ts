import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnChanges, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnFormFieldComponent, TnRadioComponent, TnRadioGroupComponent, TnSelectComponent,
  TnStepperNextDirective, TnStepperPreviousDirective,
} from '@truenas/ui-components';
import { timer } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { translated } from 'app/helpers/translated.helper';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export enum DispersalStrategy {
  None,
  Maximize,
  LimitToSingle,
}

@Component({
  selector: 'ix-enclosure-wizard-step',
  templateUrl: './enclosure-wizard-step.component.html',
  styleUrls: ['./enclosure-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnRadioComponent,
    TnRadioGroupComponent,
    TnSelectComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnStepperPreviousDirective,
    TnStepperNextDirective,
    TranslateModule,
  ],
})
export class EnclosureWizardStepComponent implements OnInit, OnChanges {
  private store = inject(PoolManagerStore);
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  protected readonly tnSelectLabels = tnSelectLabels;

  readonly isStepActive = input<boolean>();
  readonly stepWarning = input<string | null>();

  form = this.formBuilder.group({
    dispersalStrategy: [DispersalStrategy.None],
    limitToEnclosure: [null as string | null],
  });

  protected enclosureOptions$ = this.store.enclosures$.pipe(
    map((enclosures) => {
      return enclosures.map((enclosure) => ({
        label: enclosure.label || enclosure.name,
        value: enclosure.id,
      }));
    }),
  );

  // `translated`, not a plain field: the labels are composed in TypeScript rather than
  // piped in the template, so `instant()` alone would freeze them in whatever language was
  // active when the component was constructed.
  protected readonly dispersalOptions = translated((translate) => [
    {
      label: translate.instant('No Enclosure Dispersal Strategy'),
      value: DispersalStrategy.None,
    },
    {
      label: translate.instant('Maximize Enclosure Dispersal'),
      value: DispersalStrategy.Maximize,
    },
    {
      label: translate.instant('Limit Pool To A Single Enclosure'),
      value: DispersalStrategy.LimitToSingle,
    },
  ]);

  /**
   * The option label is the enclosure name while the value is its id, so the test id is pinned
   * to the label to keep the pre-migration `option-limit-to-enclosure-<name>`.
   */
  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  protected readonly helptext = helptextPoolCreation;

  get isLimitingToSingle(): boolean {
    return this.form.value.dispersalStrategy === DispersalStrategy.LimitToSingle;
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isStepActive.currentValue && !changes.isStepActive.previousValue && !this.form.touched) {
      this.form.updateValueAndValidity();
    }
  }

  ngOnInit(): void {
    this.connectFormToStore();

    this.form.controls.dispersalStrategy.valueChanges.pipe(
      filter((value) => value !== DispersalStrategy.LimitToSingle),
      switchMap(() => timer(0)),
      tap(() => {
        this.form.controls.limitToEnclosure.removeValidators(Validators.required);
        this.form.controls.limitToEnclosure.setValue(null);
        this.cdr.markForCheck();
      }),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.store.startOver$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      // `tn-radio-group` owns the checked state of its options, so a plain reset is enough here.
      this.form.reset({
        dispersalStrategy: DispersalStrategy.None,
      });
      this.cdr.markForCheck();
    });
  }

  private connectFormToStore(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.store.setEnclosureOptions({
        limitToSingleEnclosure: this.isLimitingToSingle
          ? (value.limitToEnclosure || null)
          : null,
        maximizeEnclosureDispersal: value.dispersalStrategy === DispersalStrategy.Maximize,
        dispersalStrategy: value.dispersalStrategy || DispersalStrategy.None,
      });
    });
  }
}
