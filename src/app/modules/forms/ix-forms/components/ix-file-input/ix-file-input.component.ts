import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, input, viewChild,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-file-input',
  templateUrl: './ix-file-input.component.html',
  styleUrls: ['./ix-file-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatTooltip,
    IxIconComponent,
    ReactiveFormsModule,
    IxErrorsComponent,
    TranslateModule,
    TestDirective,
    TestOverrideDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxFileInputComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly tooltip = input<string>();
  readonly acceptedFiles = input('*.*');
  readonly multiple = input<boolean>();
  readonly required = input<boolean>(false);

  protected value: FileList;
  protected isDisabled = false;

  private onChange: (value: File[]) => void = (): void => {};
  private onTouch: () => void = (): void => {};
  private fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
    private formatter: IxFormatterService,
    private translate: TranslateService,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChanged(value: FileList): void {
    this.value = value;
    this.onTouch();
    this.onChange([...value]);
  }

  writeValue(value: File[] | null): void {
    this.value = this.transformFiles(value || []);
    if (!value?.length) {
      this.fileInput().nativeElement.value = null;
    }

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

  // TODO: Workaround for https://github.com/angular/angular/issues/56471
  protected trackByIdentity(item: File): File {
    return item;
  }
}
