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

  public list(): FieldSet[] {
    return this._fieldSets;
  }

  public toggleSets(setNames: string[] = []): this {
    this._fieldSets
      .filter(set => setNames.some(name => name === set.name))
      .forEach(set => (set.label = !set.label));
    return this;
  }

  public toggleDividers(divNames: string[] = []): this {
    this._fieldSets
      .filter(set => divNames.some(name => name === set.name))
      .forEach(set => (set.divider = !set.divider));
    return this;
  }
}
