import { AuditEvent } from 'app/enums/audit-event.enum';
import { getLogImportantData } from 'app/helpers/get-log-important-data.helper';
import { AuditEntry } from 'app/interfaces/audit.interface';

const data = {
  authentication: {
    event: AuditEvent.Authentication,
    event_data: {
      clientAccount: 'root',
    },
  } as AuditEntry,
  connect: {
    event: AuditEvent.Connect,
    event_data: {
      host: '192.168.1.1',
    },
  } as AuditEntry,
  disconnect: {
    event: AuditEvent.Disconnect,
    event_data: {
      host: '1.1.1.1',
    },
  } as AuditEntry,
  create: {
    event: AuditEvent.Create,
    event_data: {
      file: {
        path: '/root/mnt/create.txt',
      },
    },
  } as AuditEntry,
  unlink: {
    event: AuditEvent.Unlink,
    event_data: {
      file: {
        path: '/root/mnt/unlink.txt',
      },
    },
  } as AuditEntry,
  rename: {
    event: AuditEvent.Rename,
    event_data: {
      src_file: {
        path: 'test.txt',
      },
      dst_file: {
        path: 'renamed.txt',
      },
    },
  } as AuditEntry,
  close: {
    event: AuditEvent.Close,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'close-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
  read: {
    event: AuditEvent.Read,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'read-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
  write: {
    event: AuditEvent.Write,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'write-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
  offloadRead: {
    event: AuditEvent.OffloadRead,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'offloadRead-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
  offloadWrite: {
    event: AuditEvent.OffloadWrite,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'offloadWrite-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
  setAcl: {
    event: AuditEvent.SetAcl,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'setAcl-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
  setAttr: {
    event: AuditEvent.SetAttr,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'setAttr-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
  setQuota: {
    event: AuditEvent.SetQuota,
    event_data: {
      file: {
        handle: {
          type: 'DEV_INO',
          value: 'setQuota-5243027:2:0',
        },
      },
    },
  } as unknown as AuditEntry,
};

describe('get important data from log', () => {
  it('returns value for Authentication type', () => {
    expect(getLogImportantData(data.authentication)).toBe('Account: root');
  });

  it('returns value for Connect type', () => {
    expect(getLogImportantData(data.connect)).toBe('Host: 192.168.1.1');
  });

  it('returns value for Disconnect type', () => {
    expect(getLogImportantData(data.disconnect)).toBe('Host: 1.1.1.1');
  });

  it('returns value for Create type', () => {
    expect(getLogImportantData(data.create)).toBe('File: /root/mnt/create.txt');
  });

  it('returns value for Unlink type', () => {
    expect(getLogImportantData(data.unlink)).toBe('File: /root/mnt/unlink.txt');
  });

  it('returns value for Rename type', () => {
    expect(getLogImportantData(data.rename)).toBe('test.txt -> renamed.txt');
  });

  it('returns value for Close type', () => {
    expect(getLogImportantData(data.close)).toBe('File: DEV_INO/close-5243027:2:0');
  });

  it('returns value for Read type', () => {
    expect(getLogImportantData(data.read)).toBe('File: DEV_INO/read-5243027:2:0');
  });

  it('returns value for Write type', () => {
    expect(getLogImportantData(data.write)).toBe('File: DEV_INO/write-5243027:2:0');
  });

  it('returns value for OffloadRead type', () => {
    expect(getLogImportantData(data.offloadRead)).toBe('File: DEV_INO/offloadRead-5243027:2:0');
  });

  it('returns value for OffloadWrite type', () => {
    expect(getLogImportantData(data.offloadWrite)).toBe('File: DEV_INO/offloadWrite-5243027:2:0');
  });

  it('returns value for SetAcl type', () => {
    expect(getLogImportantData(data.setAcl)).toBe('File: DEV_INO/setAcl-5243027:2:0');
  });

  it('returns value for SetAttr type', () => {
    expect(getLogImportantData(data.setAttr)).toBe('File: DEV_INO/setAttr-5243027:2:0');
  });

  it('returns value for SetQuota type', () => {
    expect(getLogImportantData(data.setQuota)).toBe('File: DEV_INO/setQuota-5243027:2:0');
  });
});
