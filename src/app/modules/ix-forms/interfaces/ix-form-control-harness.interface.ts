export interface IxFormControlHarness {
  getLabelText(): Promise<string>;
  getValue(): Promise<unknown>;
  setValue(value: unknown): Promise<void>;
  isDisabled(): Promise<boolean>;
}
