import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnRadioComponent, TnSelectComponent, TnSelectOption,
} from '@truenas/ui-components';
import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates/enclosure-mocks';
import {
  MockEnclosureScenario,
  mockEnclosureScenarioLabels,
} from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { setEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-enclosure-mock-tab',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TnButtonComponent,
    TnCheckboxComponent,
    TnFormFieldComponent,
    TnRadioComponent,
    TnSelectComponent,
    TranslateModule,
  ],
  templateUrl: './enclosure-mock-tab.component.html',
  styleUrls: ['./enclosure-mock-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureMockTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);

  validationError: string | null = null;

  readonly form = this.fb.group({
    enabled: [false],
    controllerModel: [null as string | null, Validators.required],
    expansionModels: [[] as string[]],
    scenario: [MockEnclosureScenario.FillSomeSlots, Validators.required],
  });

  protected readonly controllerOptions: TnSelectOption<string>[] = enclosureMocks
    .filter((mock) => mock.controller)
    .map((mock) => ({
      label: mock.model,
      value: mock.model,
    }));

  protected readonly expansionOptions: TnSelectOption<string>[] = enclosureMocks
    .filter((mock) => !mock.controller)
    .map((mock) => ({
      label: mock.model,
      value: mock.model,
    }));

  protected readonly scenarioOptions: TnSelectOption<MockEnclosureScenario>[] = Array
    .from(mockEnclosureScenarioLabels)
    .map(([value, label]) => ({
      label,
      value,
    }));

  protected getScenarioLabel(scenario: MockEnclosureScenario): string {
    const scenarioOption = Array.from(mockEnclosureScenarioLabels).find(([value]) => value === scenario);
    return scenarioOption ? scenarioOption[1] : '';
  }

  ngOnInit(): void {
    this.loadCurrentConfig();
    this.setupFormListeners();
  }

  onApply(): void {
    const formValue = this.form.getRawValue();

    // Only validate when trying to enable mocking
    if (formValue.enabled && this.form.invalid) {
      this.validationError = this.getValidationError();
      if (this.validationError) {
        console.warn('Enclosure mock configuration invalid:', this.validationError);
        return;
      }
    } else {
      this.validationError = null;
    }

    const config = {
      enabled: formValue.enabled || false,
      controllerModel: formValue.controllerModel as EnclosureModel | null,
      expansionModels: formValue.expansionModels as EnclosureModel[],
      scenario: formValue.scenario || MockEnclosureScenario.FillSomeSlots,
    };

    this.store.dispatch(setEnclosureMockConfig({ config }));
  }

  private getValidationError(): string | null {
    if (!this.form.controls.controllerModel.value && this.form.controls.enabled.value) {
      return 'Controller model is required when enclosure mocking is enabled';
    }

    if (this.form.controls.scenario.invalid) {
      return 'Invalid scenario selected';
    }

    return null;
  }

  private setupFormListeners(): void {
    // Disable/enable form controls based on enabled state
    this.form.controls.enabled.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((enabled) => {
      if (enabled) {
        this.form.controls.controllerModel.enable();
        this.form.controls.expansionModels.enable();
        this.form.controls.scenario.enable();
      } else {
        this.form.controls.controllerModel.disable();
        this.form.controls.expansionModels.disable();
        this.form.controls.scenario.disable();
      }
    });

    // Initialize disabled state
    if (!this.form.value.enabled) {
      this.form.controls.controllerModel.disable();
      this.form.controls.expansionModels.disable();
      this.form.controls.scenario.disable();
    }
  }

  private loadCurrentConfig(): void {
    this.store.select(selectEnclosureMockConfig)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((config) => {
        this.form.patchValue({
          enabled: config.enabled,
          controllerModel: config.controllerModel,
          expansionModels: config.expansionModels,
          scenario: config.scenario,
        });
      });
  }
}
