import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/port-form/port-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of-ports',
  templateUrl: './nvme-of-ports.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class NvmeOfPortsComponent {
  constructor(
    private slideIn: SlideIn,
  ) {}

  protected addPort(): void {
    this.slideIn.open(PortFormComponent);
  }
}
