import {
  inject, ChangeDetectionStrategy, Component, output, signal, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import ipRegex from 'ip-regex';
import { Observable, debounceTime, map } from 'rxjs';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InterfacesStore } from 'app/pages/system/network/stores/interfaces.store';

interface DisplayInterface {
  address: string;
  kind: string;
}

function ipValidator(control: FormControl<string>): { invalidIp: boolean } | null {
  if (!control.value || control.value === '') {
    return null;
  }

  const isValid = ipRegex({ exact: true, includeBoundaries: true }).test(control.value);
  return isValid ? null : { invalidIp: true };
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
  providers: [
    InterfacesStore,
  ],
})
export class TruenasConnectInterfaceSelectorComponent {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private interfaces$: Observable<DisplayInterface[]> = this.api.call('interface.ip_in_use').pipe(
    map((ifaces) => ifaces.map((iface) => ({ address: iface.address, kind: iface.type === 'INET' ? 'IPv4' : 'IPv6' }))),
  );

  readonly interfacesSelected = output<string[]>();
  readonly isValid = output<boolean>();
  protected interfaces = toSignal(this.interfaces$);
  protected selectedInterfaces = signal<Set<string>>(new Set());
  protected customIpControl = new FormControl({ value: '', disabled: true }, [ipValidator]);
  protected customEnabled = signal(false);

  constructor() {
    this.customIpControl.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.emitSelection();
    });

    this.customIpControl.statusChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.emitValidationState();
    });
  }

  protected toggleInterface(iface: string): void {
    const selected = new Set(this.selectedInterfaces());

    if (selected.has(iface)) {
      selected.delete(iface);
    } else {
      selected.add(iface);
    }

    this.selectedInterfaces.set(selected);
    this.emitSelection();
  }

  protected toggleCustom(): void {
    const enabled = !this.customEnabled();
    this.customEnabled.set(enabled);

    if (enabled) {
      this.customIpControl.enable();
    } else {
      this.customIpControl.disable();
      this.customIpControl.setValue('');
    }
  }

  protected isSelected(iface: string): boolean {
    return this.selectedInterfaces().has(iface);
  }

  private emitSelection(): void {
    const selected = Array.from(this.selectedInterfaces());
    const customIp = this.customIpControl.value?.trim();

    if (customIp && this.customEnabled() && this.customIpControl.valid) {
      selected.push(customIp);
    }

    this.interfacesSelected.emit(selected);
    this.emitValidationState();
  }

  private emitValidationState(): void {
    const isValid = !this.customEnabled()
      || !this.customIpControl.value?.trim()
      || this.customIpControl.valid;
    this.isValid.emit(isValid);
  }
}
