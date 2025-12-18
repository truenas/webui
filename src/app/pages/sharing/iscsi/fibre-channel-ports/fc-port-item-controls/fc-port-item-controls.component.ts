import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, OnInit,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { configurePortControlsForMode } from 'app/pages/sharing/iscsi/fibre-channel-ports/helpers/port-mode-control.helper';

@Component({
  selector: 'ix-fc-port-item-controls',
  templateUrl: './fc-port-item-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class FcPortItemControlsComponent implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  // Inputs from parent
  readonly form = input.required<FormGroup<{
    port: FormControl<string | null>;
    host_id: FormControl<number | null>;
  }>>();

  readonly isEdit = input(false);
  readonly currentPort = input<string | null>(null);
  readonly usedPhysicalPorts = input.required<string[]>();
  readonly availablePorts = input.required<string[]>();

  // Local mode control (not part of parent form)
  modeControl = this.fb.control<'existing' | 'new'>('existing');

  // Mode options for dropdown
  readonly modeOptions$ = of([
    { label: this.translate.instant('Use existing port'), value: 'existing' },
    { label: this.translate.instant('Create new virtual port'), value: 'new' },
  ] as Option[]);

  // Data sources (computed signal converted to observable for ix-select compatibility)
  readonly existingPortOptions = computed(() => {
    const availablePorts = this.availablePorts();
    const usedPhysicalPorts = this.usedPhysicalPorts();
    const currentPort = this.currentPort();

    // Filter out ports that share physical port prefix with OTHER selections
    let options = availablePorts
      .filter((port) => {
        const portPhysicalPrefix = port.split('/')[0];
        return !usedPhysicalPorts.includes(portPhysicalPrefix);
      })
      .map((value) => ({ label: value, value } as Option));

    // Add current port in edit mode (always show current selection)
    if (this.isEdit() && currentPort && !options.some((option) => option.value === currentPort)) {
      options = [{ label: currentPort, value: currentPort }, ...options];
    }

    return options;
  });

  readonly existingPortOptions$ = toObservable(this.existingPortOptions);

  readonly creatingPortOptions$ = this.api.call('fc.fc_host.query').pipe(
    map((hosts) => hosts.map((host) => ({
      label: `${host.alias}/${host.npiv + 1}`,
      value: host.id,
    } as Option))),
  );

  constructor() {
    // Initialize mode based on edit state
    effect(() => {
      const currentPortValue = this.currentPort();
      if (this.isEdit() && currentPortValue) {
        this.modeControl.setValue('existing');
        this.form().controls.port.setValue(currentPortValue);
        this.form().controls.host_id.setValue(null);
      }
    });
  }

  ngOnInit(): void {
    // Handle mode switching with helper
    this.modeControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((mode) => {
      configurePortControlsForMode(mode, this.form().controls);
    });
  }
}
