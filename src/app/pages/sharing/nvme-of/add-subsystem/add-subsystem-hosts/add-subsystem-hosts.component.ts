import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfHost, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddHostMenuComponent } from 'app/pages/sharing/nvme-of/hosts/add-host-menu/add-host-menu.component';

@Component({
  selector: 'ix-add-subsystem-hosts',
  templateUrl: './add-subsystem-hosts.component.html',
  styleUrl: './add-subsystem-hosts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AddHostMenuComponent,
    TranslateModule,
    IxIconComponent,
    MatIconButton,
    MatTooltip,
    TestDirective,
  ],
})
export class AddSubsystemHostsComponent {
  hostsControl = input.required<FormControl<NvmeOfHost[]>>();

  get subsystem(): NvmeOfSubsystemDetails {
    return { hosts: this.hostsControl()?.value } as NvmeOfSubsystemDetails;
  }

  protected readonly helptext = helptextNvmeOf;

  protected onHostAdded(host: NvmeOfHost): void {
    const hosts = this.hostsControl().value;

    this.hostsControl().setValue([...hosts, host]);
  }

  protected onRemoveHost(hostToRemove: NvmeOfHost): void {
    const hosts = this.hostsControl().value;

    this.hostsControl().setValue(
      hosts.filter((host) => host.id !== hostToRemove.id),
    );
  }
}
