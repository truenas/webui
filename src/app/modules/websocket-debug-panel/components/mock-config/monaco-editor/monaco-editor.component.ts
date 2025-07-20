import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'ix-monaco-editor',
  standalone: true,
  imports: [FormsModule, MatFormField, MatLabel, MatInput],
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonacoEditorComponent {
  readonly value = input<unknown>(null);
  readonly language = input('json');
  readonly height = input(200);
  readonly valueChange = output<unknown>();

  protected get displayValue(): string {
    const val = this.value();
    if (val === null || val === undefined) {
      return '';
    }
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }

  protected onValueChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;

    if (!value.trim()) {
      this.valueChange.emit(null);
      return;
    }

    try {
      const parsed = JSON.parse(value) as unknown;
      this.valueChange.emit(parsed);
    } catch {
      // Keep the string value if it's not valid JSON
      this.valueChange.emit(value);
    }
  }
}
