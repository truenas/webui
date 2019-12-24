import { FieldSet } from "../models/fieldset.interface";

export class FieldSets {
  constructor(private readonly _fieldSets: FieldSet[] = []) {}

  public config(configName: string) {
    return this.list()
      .find(
        set =>
          set.config && set.config.some(config => config.name === configName)
      )
      .config.find(config => config.name === configName);
  }

  public hideConfig(configName: string): this {
    this.config(configName).isHidden = true;
    return this;
  }

  public list(): FieldSet[] {
    return this._fieldSets;
  }

  public showConfig(configName: string): this {
    this.config(configName).isHidden = false;
    return this;
  }

  public toggleSets(setClasses: string[] = []): this {
    this._fieldSets
      .filter(set => setClasses.some(c => c === set.class))
      .forEach(set => (set.label = !set.label));
    return this;
  }

  public toggleDividers(divNames: string[] = []): this {
    this._fieldSets
      .filter(set => divNames.some(name => name === set.name))
      .forEach(set => (set.divider = !set.divider));
    return this;
  }

  /**
   * Like showConfig or hideConfig, but for times when the isHidden value
   * is computed at runtime.
   */
  public toggleConfigVisibility(configName: string, isHidden: boolean): this {
    this.config(configName).isHidden = isHidden;
    return this;
  }
}
