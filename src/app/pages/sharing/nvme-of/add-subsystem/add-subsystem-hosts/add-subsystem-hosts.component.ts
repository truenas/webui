import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconButtonComponent, TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { AddHostMenuComponent } from 'app/pages/sharing/nvme-of/hosts/add-host-menu/add-host-menu.component';

@Component({
  selector: 'ix-add-subsystem-hosts',
  templateUrl: './add-subsystem-hosts.component.html',
  styleUrl: './add-subsystem-hosts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AddHostMenuComponent,
    TranslateModule,
    TnIconComponent,
    TnIconButtonComponent,
    TnTooltipDirective,
  ],
})
export class AddSubsystemHostsComponent {
  hostsControl = input.required<FormControl<NvmeOfHost[]>>();

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
