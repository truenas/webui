import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { OauthButtonType } from 'app/modules/oauth-button/interfaces/oauth-button.interface';

@Component({
  selector: 'ix-jira-oauth',
  templateUrl: './jira-oauth.component.html',
  styleUrls: ['./jira-oauth.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JiraOauthComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() placeholder: string = this.translate.instant('Token is required. Please login to get one!');
  value = '';
  disabled = false;
  readonly = true;
  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

  readonly oauthType = OauthButtonType;

  writeValue(value: string): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  get hasOauthAuthorization(): boolean {
    return Boolean(this.value?.length);
  }

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  shouldShowResetInput(): boolean {
    return this.hasOauthAuthorization;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  setReadonlyState?(isReadonly: boolean): void {
    this.readonly = isReadonly;
    this.cdr.markForCheck();
  }

  resetInput(): void {
    this.value = '';
    this.onChange('');
    this.cdr.markForCheck();
  }

  input(value: string): void {
    this.value = value;
    this.onChange(this.value);
  }
}
