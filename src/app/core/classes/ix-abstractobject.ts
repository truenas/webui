import { UUID } from 'angular2-uuid';

export abstract class iXAbstractObject {

  readonly id: string;

  constructor() {
    this.id = "id-" + UUID.UUID();
  }
}
