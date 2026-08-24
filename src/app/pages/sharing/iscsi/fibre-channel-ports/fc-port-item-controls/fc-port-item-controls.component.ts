import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnFormFieldComponent, TnSelectComponent } from '@truenas/ui-components';
import { map } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { optionTestIdByKebabLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { ApiService } from 'app/modules/websocket/api.service';
import { configurePortControlsForMode } from 'app/pages/sharing/iscsi/fibre-channel-ports/helpers/port-mode-control.helper';

@Component({
  selector: 'ix-fc-port-item-controls',
  templateUrl: './fc-port-item-controls.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnSelectComponent,
    TranslateModule,
  ],
})
export class FcPortItemControlsComponent implements OnInit {
  protected readonly tnSelectLabels = tnSelectLabels;

  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);

  // Inputs from parent
  readonly form = input.required<FormGroup<{
    port: FormControl<string | null>;
    host_id: FormControl<number | null>;
  }>>();

  /** Row position in the parent's fcPorts array; scopes this row's test ids and DOM ids. */
  readonly index = input.required<number>();

  readonly isEdit = input(false);
  readonly currentPort = input<string | null>(null);
  readonly usedPhysicalPorts = input.required<string[]>();
  readonly availablePorts = input.required<string[]>();

  // Local mode control (not part of parent form)
  protected modeControl = this.fb.control<'existing' | 'new'>('existing');

  // Mode options for dropdown. A plain array: tn-select takes a synchronous [options].
  protected readonly modeOptions = [
    { label: this.translate.instant('Use existing port'), value: 'existing' },
    { label: this.translate.instant('Create new virtual port'), value: 'new' },
  ] as Option[];

  /**
   * Port labels ('fc0/1') carry a letter→digit boundary that the library's kebab does not split
   * but lodash — and therefore the legacy `[ixTest]` — did. Keying off the kebab-cased label keeps
   * `option-…-fc-0-1` and, for the host select, keeps the id off `host.id`, a per-appliance DB row
   * id that no test could rely on.
   */
  protected readonly portOptionTestIdKey = optionTestIdByKebabLabel;

  protected readonly existingPortOptions = computed(() => {
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

  protected readonly creatingPortOptions$ = this.api.call('fc.fc_host.query').pipe(
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
    // Configure for the initial mode explicitly. The parent builds the fcPorts group without
    // validators and this component owns them, so leaving it to `valueChanges` below would leave
    // the default 'existing' mode unvalidated until the user touched the select — previously
    // papered over by `ix-select` echoing its initial value back through `ngModelChange`.
    configurePortControlsForMode(this.modeControl.value, this.form().controls);

    // Handle mode switching with helper
    this.modeControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((mode) => {
      configurePortControlsForMode(mode, this.form().controls);
    });
  }
}
