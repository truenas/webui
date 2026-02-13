import {
  ChangeDetectionStrategy, Component, output, signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface NetworkInterface {
  name: string;
  address: string;
}

@Component({
  selector: 'ix-truenas-connect-interface-selector',
  imports: [
    MatCheckbox,
    ReactiveFormsModule,
    TranslateModule,
    TestDirective,
  ],
  templateUrl: './truenas-connect-interface-selector.component.html',
  styleUrl: './truenas-connect-interface-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TruenasConnectInterfaceSelectorComponent {
  readonly interfacesSelected = output<string[]>();

  protected interfaces = signal<NetworkInterface[]>([
    // Mock data - will be replaced with API call in the future
    { name: 'eth0', address: '192.168.1.100' },
  ]);

  protected selectedInterfaces = signal<Set<string>>(new Set());
  protected customIpControl = new FormControl({ value: '', disabled: true });
  protected customEnabled = signal(false);

  protected toggleInterface(interfaceName: string): void {
    const selected = new Set(this.selectedInterfaces());

    if (selected.has(interfaceName)) {
      selected.delete(interfaceName);
    } else {
      selected.add(interfaceName);
    }

    this.selectedInterfaces.set(selected);
    this.emitSelection();
  }

  protected toggleCustom(): void {
    const enabled = !this.customEnabled();
    this.customEnabled.set(enabled);

    if (enabled) {
      this.customIpControl.enable();
      this.selectedInterfaces().add('custom');
    } else {
      this.customIpControl.disable();
      this.customIpControl.setValue('');
      this.selectedInterfaces().delete('custom');
    }

    this.emitSelection();
  }

  protected isSelected(interfaceName: string): boolean {
    return this.selectedInterfaces().has(interfaceName);
  }

  private emitSelection(): void {
    const selected = Array.from(this.selectedInterfaces());
    this.interfacesSelected.emit(selected);
  }
}
