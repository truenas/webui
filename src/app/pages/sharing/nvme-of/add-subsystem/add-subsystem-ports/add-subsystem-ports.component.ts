import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatIconButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddPortMenuComponent } from 'app/pages/sharing/nvme-of/ports/add-port-menu/add-port-menu.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';

@Component({
  selector: 'ix-add-subsystem-ports',
  templateUrl: './add-subsystem-ports.component.html',
  styleUrl: './add-subsystem-ports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AddPortMenuComponent,
    TranslateModule,
    IxIconComponent,
    MatIconButton,
    TestDirective,
    PortDescriptionComponent,
  ],
})
export class AddSubsystemPortsComponent {
  portsControl = input.required<FormControl<NvmeOfPort[]>>();

  protected readonly helptext = helptextNvmeOf;

  protected onPortAdded(port: NvmeOfPort): void {
    const ports = this.portsControl().value;

    this.portsControl().setValue([...ports, port]);
  }

  protected onRemovePort(portToRemove: NvmeOfPort): void {
    const ports = this.portsControl().value;

    this.portsControl().setValue(
      ports.filter((port) => port.id !== portToRemove.id),
    );
  }
}
