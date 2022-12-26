import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { PoolManagerWizardForm } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit {
  form = this.fb.group<PoolManagerWizardForm>({
    general: this.fb.group({
      name: ['', Validators.required],
      encryption: [false, Validators.required],
    }),
    data: this.fb.group({
      type: [CreateVdevLayout.Stripe, Validators.required],
      size: [null as string, Validators.required],
      width: [null as number, Validators.required],
      number: [null as number, Validators.required],
    }),
    log: this.fb.group({}),
    spare: this.fb.group({}),
    cache: this.fb.group({}),
    metadata: this.fb.group({}),
    review: this.fb.group({}),
  });

  constructor(
    private fb: FormBuilder,
    private poolManagerStore: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.loadPoolsData();

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe((formValue) => {
      this.poolManagerStore.updateFormValue(formValue);
    });
  }
}
