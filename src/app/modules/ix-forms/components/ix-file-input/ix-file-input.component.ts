import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';

@UntilDestroy()
@Component({
  selector: 'ix-file-input',
  templateUrl: './ix-file-input.component.html',
  styleUrls: ['./ix-file-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxFileInputComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() acceptedFiles = '*.*';
  @Input() multiple: boolean;
  @Input() required: boolean;

  value: FileList;
  isDisabled = false;

  onChange: (value: File[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
    private formatter: IxFormatterService,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChanged(value: FileList): void {
    this.value = value;
    this.onChange([...value]);
  }

  writeValue(value: File[] | null): void {
    if (!value?.length) {
      return;
    }
    this.value = this.transformFiles(value);
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: File[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  removeFile(file: File): void {
    const files = Array.from(this.value);
    files.splice(files.indexOf(file), 1);
    this.onChanged(this.transformFiles(files));
    this.cdr.markForCheck();
  }

  formatSize(size: number): string {
    return this.formatter.convertBytesToHumanReadable(size);
  }

  /**
  * @param files Array of files to add to the FileList
  * @returns FileList
  */
  transformFiles(files: File[]): FileList {
    const dataTransfer = new ClipboardEvent('').clipboardData || new DataTransfer();
    for (let i = 0, len = files.length; i < len; i++) {
      dataTransfer.items.add(files[i]);
    }
    return dataTransfer.files;
  }

  asFileInput(target: EventTarget): HTMLInputElement {
    return target as HTMLInputElement;
  }
}
