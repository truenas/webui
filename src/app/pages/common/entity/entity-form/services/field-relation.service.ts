import { Injectable } from "@angular/core";
import { FormGroup, FormControl } from "@angular/forms";
import { FieldConfig } from "../models/field-config.interface";
import { FieldRelation, RelationGroup, ACTION_DISABLE, ACTION_ENABLE, CONNECTION_AND,CONNECTION_OR } from "../models/field-relation.interface";

@Injectable()
export class FieldRelationService {

  constructor() {}

  findActivationRelation(relGroups: RelationGroup[]): RelationGroup {
    return relGroups.find(rel => rel.action === ACTION_DISABLE || rel.action === ACTION_ENABLE);
  }

  getRelatedFormControls(model: FieldConfig, controlGroup: FormGroup): FormControl[] {
    let controls: FormControl[] = [];
    
    model.relation.forEach(relGroup => relGroup.when.forEach(rel => {
      if (model.name === rel.name) {
        throw new Error(`FormControl ${model.name} cannot depend on itself`);
      }
      let control = <FormControl> controlGroup.get(rel.name);
      if (control && !controls.some(controlElement => controlElement === control)) {
        controls.push(control);
      }
    }));
    return controls;
  }

  isFormControlToBeDisabled(relGroup: RelationGroup, formGroup: FormGroup): boolean {
    return relGroup.when.reduce((toBeDisabled: boolean, rel: FieldRelation, index: number) => {
      let control = formGroup.get(rel.name);
      
      if (control && relGroup.action === ACTION_DISABLE) {
        if (index > 0 && relGroup.connective === CONNECTION_AND && !toBeDisabled) {
          return false;
        }
        if (index > 0 && relGroup.connective === CONNECTION_OR && toBeDisabled) {
          return true;
        }
        return rel.value === control.value || rel.status === control.status;
      }

      if (control && relGroup.action === ACTION_ENABLE) {
        if (index > 0 && relGroup.connective === CONNECTION_AND && toBeDisabled) {
          return true;
        }
        if (index > 0 && relGroup.connective === CONNECTION_OR && !toBeDisabled) {
          return false;
        }
        return !(rel.value === control.value || rel.status === control.status);
      }
      return false;
    }, false);
  }
}