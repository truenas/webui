import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { OauthJiraMessage } from 'app/interfaces/support.interface';

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

  writeValue(value: string): void {
    this.value = value;
    this.cdr.markForCheck();
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

  initSession(): void {
    const authFn = (message: OauthJiraMessage): void => this.doAuth(message);

    window.removeEventListener('message', authFn, false);
    window.open('https://support-proxy.ixsystems.com/oauth/initiate?origin=' + encodeURIComponent(window.location.toString()), '_blank', 'width=640,height=480');
    window.addEventListener('message', authFn, false);
  }

  doAuth(message: OauthJiraMessage): void {
    const token = message.data as string;
    this.input(token);
    this.cdr.markForCheck();
  }

  shouldShowResetInput(): boolean {
    return this.hasValue();
  }

  hasValue(): boolean {
    return Boolean(this.value?.length);
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
