export enum Permission {
  ReadData = 'READ_DATA',
  WriteData = 'WRITE_DATA',
  AppendData = 'APPEND_DATA',
  ReadNamedAttrs = 'READ_NAMED_ATTRS',
  WriteNamedAttrs = 'WRITE_NAMED_ATTRS',
  Execute = 'EXECUTE',
  DeleteChild = 'DELETE_CHILD',
  ReadAttributes = 'READ_ATTRIBUTES',
  WriteAttributes = 'WRITE_ATTRIBUTES',
  Delete = 'DELETE',
  ReadAcl = 'READ_ACL',
  WriteAcl = 'WRITE_ACL',
  WriteOwner = 'WRITE_OWNER',
  Synchronize = 'SYNCHRONIZE',
  Basic = 'Basic'
}

export type Permissions = { [K in Permission]: boolean };
