import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export function hasMiniSpecificPage(enclosure: DashboardEnclosure): boolean {
  return [
    EnclosureModel.Mini3E,
    EnclosureModel.Mini3EPlus,
    EnclosureModel.Mini3X,
    EnclosureModel.Mini3XPlus,
    EnclosureModel.Mini3XlPlus,
  ].includes(enclosure.model);
}
