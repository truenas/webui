import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnChanges, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of, timer } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    ReactiveFormsModule,
    IxRadioGroupComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
  ],
})
export class EnclosureWizardStepComponent implements OnInit, OnChanges {
  private store = inject(PoolManagerStore);
  private translate = inject(TranslateService);
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

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

  protected readonly dispersalOptions$ = of([
    {
      label: this.translate.instant('No Enclosure Dispersal Strategy'),
      value: DispersalStrategy.None,
    },
    {
      label: this.translate.instant('Maximize Enclosure Dispersal'),
      value: DispersalStrategy.Maximize,
    },
    {
      label: this.translate.instant('Limit Pool To A Single Enclosure'),
      value: DispersalStrategy.LimitToSingle,
    },
  ]);

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
      this.form.reset({
        dispersalStrategy: DispersalStrategy.None,
      });
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
