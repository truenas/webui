import {
  ChangeDetectionStrategy, Component, OnInit, inject,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { enclosureMocks } from 'app/core/testing/mock-enclosure/enclosure-templates/enclosure-mocks';
import {
  MockEnclosureScenario,
  mockEnclosureScenarioLabels,
} from 'app/core/testing/mock-enclosure/enums/mock-enclosure.enum';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { setEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectEnclosureMockConfig } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-mock-tab',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatCheckbox,
    TranslateModule,
    IxSelectComponent,
    IxFieldsetComponent,
    IxRadioGroupComponent,
  ],
  templateUrl: './enclosure-mock-tab.component.html',
  styleUrls: ['./enclosure-mock-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureMockTabComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store<AppState>);

  validationError: string | null = null;

  readonly form = this.fb.group({
    enabled: [false],
    controllerModel: [null as string | null, Validators.required],
    expansionModels: [[] as string[]],
    scenario: [MockEnclosureScenario.FillSomeSlots, Validators.required],
  });

  protected readonly controllerOptions = of(enclosureMocks
    .filter((mock) => mock.controller)
    .map((mock) => ({
      label: mock.model,
      value: mock.model,
    }))).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  protected readonly expansionOptions = of(enclosureMocks
    .filter((mock) => !mock.controller)
    .map((mock) => ({
      label: mock.model,
      value: mock.model,
    }))).pipe(shareReplay({ bufferSize: 1, refCount: false }));

  protected readonly scenarioOptions = of(Array.from(mockEnclosureScenarioLabels).map(([value, label]) => ({
    label,
    value,
  })));

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
    this.form.controls.enabled.valueChanges.pipe(untilDestroyed(this)).subscribe((enabled) => {
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
      .pipe(untilDestroyed(this))
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
