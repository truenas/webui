import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Subject } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';

export interface FormConfiguration {
  prerequisite?: any;
  fieldSets?: any;
  fieldSetDisplay?: any;
  values?: any;
  saveSubmitText?: any;
  preInit?: any;
  target?: Subject<CoreEvent>;
  resource_name?: any;
  isEntity?: any;
  addCall?: any;
  editCall?: any;
  isEditJob?: any;
  queryCall?: any;
  queryCallOption?: any;
  queryKey?: any; // use this to define your id for websocket call
  isNew?: any;
  pk?: any;
  rowid?: any;
  custom_get_query?: any;
  fieldConfig?: FieldConfig[];
  resourceTransformIncomingRestData?: any;
  route_usebaseUrl?: any;
  afterInit?: any;
  initial?: any;
  dataHandler?: any;
  dataAttributeHandler?: any;
  route_cancel?: any;
  route_success?: any;
  route_delete?: any;
  custom_edit_query?: any;
  custom_add_query?: any;
  custActions?: any[];
  compactCustomActions?: any[];
  customFilter?: any[];
  confirmSubmit?: any;
  confirmSubmitDialog?: any;
  afterSave?: any;
  blurEvent?: any;
  customEditCall?: any;
  save_button_enabled?: any;
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
  hide_fileds?: any;
  isBasicMode?: any;
  advanced_field?: any;
  basic_field?: any;
  route_conf?: any;
  preHandler?: any;
  initialCount?: any;
  initialCount_default?: any;
  responseOnSubmit?: any;
  title?: any;
  columnsOnForm?: number;

  closeModalForm?(): any;
  afterModalFormClosed?(): any; // function will called once the modal form closed
  goBack?(): any;
  onSuccess?(res: any): any;
}
