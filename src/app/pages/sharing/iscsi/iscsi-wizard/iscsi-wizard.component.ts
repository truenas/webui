import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './iscsi-wizard.component.html',
  styleUrls: ['./iscsi-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IscsiWizardComponent {
  isLoading = false;
  form = this.fb.group({
    device: this.fb.group({}),
    portal: this.fb.group({}),
    initiator: this.fb.group({}),
  });

  constructor(
    private fb: FormBuilder,
    private slideInService: IxSlideInService,
  ) {}

  onSubmit(): void {
    this.slideInService.close();
  }
}
