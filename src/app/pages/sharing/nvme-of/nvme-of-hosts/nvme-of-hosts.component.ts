import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/host-form/host-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of-hosts',
  templateUrl: './nvme-of-hosts.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class NvmeOfHostsComponent {
  constructor(
    private slideIn: SlideIn,
  ) {}

  protected addHost(): void {
    this.slideIn.open(HostFormComponent);
  }
}
