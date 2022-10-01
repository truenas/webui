import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';

export class FieldSets {
  readonly advancedFields = this._init
    .filter((set) => !set.label)
    .map((set) => set.config || [])
    .reduce((flatList, configs) => flatList.concat(configs), [])
    .map((config) => config.name);

  /* Make a local copy of our initial state */
  private readonly _fieldSets = [...this._init];

  constructor(private readonly _init: FieldSet[] = []) {}

  config(configName: string): FieldConfig {
    return this.list()
      .find(
        (set) => set.config && set.config.some((config) => config.name === configName),
      )
      .config.find((config) => config.name === configName);
  }

  list(): FieldSet[] {
    return this._fieldSets;
  }
}
