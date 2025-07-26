import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MockConfigFormComponent } from 'app/modules/websocket-debug-panel/components/mock-config/mock-config-form/mock-config-form.component';
import { WebSocketDebugError } from 'app/modules/websocket-debug-panel/interfaces/error.types';
import { MockConfig } from 'app/modules/websocket-debug-panel/interfaces/mock-config.interface';
import {
  addMockConfig, deleteMockConfig, toggleMockConfig, exportMockConfigs,
} from 'app/modules/websocket-debug-panel/store/websocket-debug.actions';
import { selectMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';

@Component({
  selector: 'ix-mock-config-list',
  standalone: true,
  imports: [
    MatButton,
    MatIconButton,
    MatSlideToggle,
    MatTooltip,
    TranslateModule,
    IxIconComponent,
    MockConfigFormComponent,
  ],
  templateUrl: './mock-config-list.component.html',
  styleUrls: ['./mock-config-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockConfigListComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(DialogService);

  protected readonly mockConfigs = this.store.selectSignal(selectMockConfigs);
  protected showForm = false;
  protected editingConfig: MockConfig | null = null;

  protected readonly hasEnabledMocks = computed(() => {
    return this.mockConfigs().some((config) => config.enabled);
  });

  protected toggleConfig(id: string): void {
    this.store.dispatch(toggleMockConfig({ id }));
  }

  protected deleteConfig(id: string): void {
    this.store.dispatch(deleteMockConfig({ id }));
  }

  protected editConfig(config: MockConfig): void {
    this.editingConfig = config;
    this.showForm = true;
  }

  protected addNewConfig(): void {
    this.editingConfig = null;
    this.showForm = true;
  }

  protected onFormSubmit(config: MockConfig): void {
    if (this.editingConfig) {
      // Form component handles the update
    } else {
      this.store.dispatch(addMockConfig({ config }));
    }
    this.showForm = false;
    this.editingConfig = null;
  }

  protected onFormCancel(): void {
    this.showForm = false;
    this.editingConfig = null;
  }

  protected exportConfigs(): void {
    this.store.dispatch(exportMockConfigs());
  }

  protected importConfigs(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const content = loadEvent.target?.result;
        if (typeof content !== 'string') {
          throw new WebSocketDebugError(
            'File content is not a string',
            'INVALID_FILE_CONTENT',
          );
        }

        let configs: unknown;
        try {
          configs = JSON.parse(content);
        } catch (parseError) {
          throw new WebSocketDebugError(
            'Invalid JSON format in imported file',
            'INVALID_JSON_FORMAT',
            parseError,
          );
        }

        // Validate that configs is an array
        if (!Array.isArray(configs)) {
          throw new WebSocketDebugError(
            'Imported data must be an array of mock configurations',
            'INVALID_CONFIG_FORMAT',
          );
        }

        // Validate each config has required properties
        const validConfigs = configs.filter((config: unknown): config is MockConfig => {
          return typeof config === 'object' && config !== null
            && 'methodName' in config && typeof config.methodName === 'string'
            && 'response' in config && typeof config.response === 'object';
        });

        if (validConfigs.length === 0) {
          throw new WebSocketDebugError(
            'No valid mock configurations found in file',
            'NO_VALID_CONFIGS',
          );
        }

        if (validConfigs.length < configs.length) {
          console.warn(`Skipped ${configs.length - validConfigs.length} invalid configurations`);
        }

        validConfigs.forEach((config) => {
          this.store.dispatch(addMockConfig({ config }));
        });

        this.dialog.info(
          'Import Successful',
          `Imported ${validConfigs.length} mock configuration(s)`,
        );
      } catch (error) {
        const debugError = error instanceof WebSocketDebugError
          ? error
          : new WebSocketDebugError(
            'Failed to import mock configurations',
            'IMPORT_ERROR',
            error,
          );
        console.error(debugError.message, debugError);

        this.dialog.error({ title: 'Import Failed', message: debugError.message });
      }
    };

    reader.onerror = () => {
      const error = new WebSocketDebugError(
        'Failed to read file',
        'FILE_READ_ERROR',
      );
      console.error(error.message);
      this.dialog.error({ title: 'File Read Error', message: 'Could not read the selected file' });
    };

    reader.readAsText(file);
  }

  protected getConfigDescription(config: MockConfig): string {
    const hasEvents = config.events && config.events.length > 0;
    const type = hasEvents ? 'With Events' : 'Response';
    const pattern = config.messagePattern ? ` (${config.messagePattern})` : '';
    return `${type}: ${config.methodName}${pattern}`;
  }
}
