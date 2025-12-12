import {
  ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder, FormControl, FormGroup } from '@ngneat/reactive-forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ApiService } from 'app/modules/websocket/api.service';

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

  // Local mode control (not part of parent form)
  modeControl = this.fb.control<'existing' | 'new'>('existing');

  // Mode options for dropdown
  readonly modeOptions$ = of([
    { label: this.translate.instant('Use existing port'), value: 'existing' },
    { label: this.translate.instant('Create new virtual port'), value: 'new' },
  ] as Option[]);

  // Data sources (observables for ix-select compatibility)
  readonly existingPortOptions$ = this.api.call('fcport.port_choices', [false]).pipe(
    map((ports) => Object.keys(ports).map((value) => ({ label: value, value } as Option))),
  );

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
    // Handle mode switching
    this.modeControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((mode) => {
      if (mode === 'new') {
        // Creating new virtual port
        this.form().controls.port.clearValidators();
        this.form().controls.port.disable();
        this.form().controls.port.setValue(null);

        this.form().controls.host_id.enable();
        this.form().controls.host_id.setValidators([Validators.required]);
      } else {
        // Using existing port
        this.form().controls.host_id.clearValidators();
        this.form().controls.host_id.disable();
        this.form().controls.host_id.setValue(null);

        this.form().controls.port.enable();
        this.form().controls.port.setValidators([Validators.required]);
      }
      this.form().controls.port.updateValueAndValidity();
      this.form().controls.host_id.updateValueAndValidity();
    });
  }
}
