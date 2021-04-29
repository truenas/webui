import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';

export interface FormConfiguration {
  prerequisite?: any;
  fieldSets?: FieldSets | FieldSet[];
  fieldSetDisplay?: string;
  values?: any;
  saveSubmitText?: string;
  preInit?: any;
  target?: Subject<CoreEvent>;
  resource_name?: string;
  isEntity?: boolean;
  addCall?: string;
  editCall?: string;
  isEditJob?: boolean;
  queryCall?: string;
  queryCallOption?: any;
  queryKey?: string; // use this to define your id for websocket call
  isNew?: boolean;
  pk?: any;
  rowid?: any;
  custom_get_query?: string;
  fieldConfig?: FieldConfig[];
  resourceTransformIncomingRestData?: any;
  route_usebaseUrl?: boolean;
  afterInit?: any;
  initial?: any;
  dataHandler?: any;
  dataAttributeHandler?: any;
  route_cancel?: string[];
  route_success?: string[];
  route_delete?: any;
  custom_edit_query?: string;
  custom_add_query?: string;
  custActions?: any[];
  compactCustomActions?: any[];
  customFilter?: any[];
  confirmSubmit?: any;
  confirmSubmitDialog?: any;
  afterSave?: any;
  blurEvent?: any;
  customEditCall?: any;
  save_button_enabled?: boolean;
  hideSaveBtn?: boolean;
  form_message?: {
    type: string; // info || warning
    content: string;
  };

  afterSubmit?: any;
  beforeSubmit?: any;
  customSubmit?: any;
  clean?: any;
  errorReport?: any;
  hide_fileds?: string[];
  isBasicMode?: boolean;
  advanced_field?: string[];
  basic_field?: string[];
  route_conf?: string[];
  preHandler?: any;
  initialCount?: any;
  initialCount_default?: any;
  responseOnSubmit?: any;
  title?: string;
  columnsOnForm?: number;

  closeModalForm?(): any;
  afterModalFormClosed?(): any; // function will called once the modal form closed
  goBack?(): any;
  onSuccess?(res: any): any;
}
