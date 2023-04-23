import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { SizeAndType } from 'app/pages/storage/modules/pool-manager/interfaces/size-and-type.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit {
  isLoading$ = this.store.isLoading$;
  form = this.fb.group({
    general: this.fb.group({
      name: ['', Validators.required],
      encryption: [false],
      encryption_standard: [null as string, Validators.required],
      allowNonUniqueSerialDisks: ['false'],
      allowDisksFromExportedPools: [[] as string[]],
    }),
    data: this.fb.group({
      type: [CreateVdevLayout.Stripe, Validators.required],
      sizeAndType: [[null, null] as SizeAndType, Validators.required],
      width: [null as number, Validators.required],
      vdevsNumber: [null as number, Validators.required],
      minimizeEnclosureDispersal: [true],
      treatDiskSizeAsMinimum: [false],
    }),
    log: this.fb.group({}),
    spare: this.fb.group({}),
    cache: this.fb.group({}),
    metadata: this.fb.group({}),
    review: this.fb.group({}),
  });

  constructor(
    private fb: FormBuilder,
    private store: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.store.initialize();

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((formValue) => {
      this.store.updateFormValue(formValue);
    });
  }
}
