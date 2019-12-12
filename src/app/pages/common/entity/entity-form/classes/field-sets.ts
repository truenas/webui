import { FieldSet } from "../models/fieldset.interface";

export class FieldSets {
  constructor(private readonly _fieldSets: FieldSet[] = []) {}

  public config(configClass: string) {
    return this.list()
      .find(
        set =>
          set.config && set.config.some(config => config.class === configClass)
      )
      .config.find(config => config.name === configClass);
  }

  public list(): FieldSet[] {
    return this._fieldSets;
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
}
