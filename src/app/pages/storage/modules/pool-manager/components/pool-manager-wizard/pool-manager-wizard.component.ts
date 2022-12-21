import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent {
  form = this.fb.group({
    general: this.fb.group({
      name: ['', Validators.required],
      encryption: [false, Validators.required],
    }),
    data: this.fb.group({}),
    log: this.fb.group({}),
    spare: this.fb.group({}),
    cache: this.fb.group({}),
    metadata: this.fb.group({}),
    review: this.fb.group({}),
  });

  constructor(
    private fb: FormBuilder,
  ) {}
}
