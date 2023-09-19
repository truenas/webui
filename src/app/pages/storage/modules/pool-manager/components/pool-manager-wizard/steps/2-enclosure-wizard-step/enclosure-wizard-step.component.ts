import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of, timer } from 'rxjs';
import {
  filter, map, switchMap, tap,
} from 'rxjs/operators';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export enum DispersalStrategy {
  None,
  Maximize,
  LimitToSingle,
}

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-wizard-step',
  templateUrl: './enclosure-wizard-step.component.html',
  styleUrls: ['./enclosure-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureWizardStepComponent implements OnInit, OnChanges {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;

  form = this.formBuilder.group({
    dispersalStrategy: [DispersalStrategy.None],
    limitToEnclosure: [null as number],
  });

  protected enclosureOptions$ = this.store.enclosures$.pipe(
    map((enclosures) => {
      return enclosures.map((enclosure) => ({
        label: enclosure.label || enclosure.name,
        value: enclosure.number,
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

  protected readonly helptext = helptext;

  constructor(
    private store: PoolManagerStore,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {}

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
    ).pipe(untilDestroyed(this)).subscribe();

    this.store.startOver$.pipe(untilDestroyed(this)).subscribe(() => {
      this.form.reset({
        dispersalStrategy: DispersalStrategy.None,
      });
    });
  }

  private connectFormToStore(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      this.store.setEnclosureOptions({
        limitToSingleEnclosure: this.isLimitingToSingle ? value.limitToEnclosure : null,
        maximizeEnclosureDispersal: value.dispersalStrategy === DispersalStrategy.Maximize,
        dispersalStrategy: value.dispersalStrategy,
      });
    });
  }
}
