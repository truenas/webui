import { TranslateService } from '@ngx-translate/core';
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
  } as AuditEntry,
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
  } as AuditEntry,
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
  } as AuditEntry,
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
  } as AuditEntry,
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
  } as AuditEntry,
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
  } as AuditEntry,
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
  } as AuditEntry,
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
  } as AuditEntry,
};

function fakeInstant(key: string, interpolateParams?: Record<string, unknown>): string {
  Object.entries(interpolateParams).forEach(([param, value]) => {
    key = key.replace(`{${param}}`, String(value));
  });
  return key;
}

describe('get important data from log', () => {
  const translate = {
    instant: jest.fn((label, params) => fakeInstant(label, params)) as TranslateService['instant'],
  } as TranslateService;

  it('returns value for Authentication type', () => {
    expect(getLogImportantData(data.authentication, translate)).toBe('Account: root');
  });

  it('returns value for Connect type', () => {
    expect(getLogImportantData(data.connect, translate)).toBe('Host: 192.168.1.1');
  });

  it('returns value for Disconnect type', () => {
    expect(getLogImportantData(data.disconnect, translate)).toBe('Host: 1.1.1.1');
  });

  it('returns value for Create type', () => {
    expect(getLogImportantData(data.create, translate)).toBe('File: /root/mnt/create.txt');
  });

  it('returns value for Unlink type', () => {
    expect(getLogImportantData(data.unlink, translate)).toBe('File: /root/mnt/unlink.txt');
  });

  it('returns value for Rename type', () => {
    expect(getLogImportantData(data.rename, translate)).toBe('test.txt -> renamed.txt');
  });

  it('returns value for Close type', () => {
    expect(getLogImportantData(data.close, translate)).toBe('File: DEV_INO/close-5243027:2:0');
  });

  it('returns value for Read type', () => {
    expect(getLogImportantData(data.read, translate)).toBe('File: DEV_INO/read-5243027:2:0');
  });

  it('returns value for Write type', () => {
    expect(getLogImportantData(data.write, translate)).toBe('File: DEV_INO/write-5243027:2:0');
  });

  it('returns value for OffloadRead type', () => {
    expect(getLogImportantData(data.offloadRead, translate)).toBe('File: DEV_INO/offloadRead-5243027:2:0');
  });

  it('returns value for OffloadWrite type', () => {
    expect(getLogImportantData(data.offloadWrite, translate)).toBe('File: DEV_INO/offloadWrite-5243027:2:0');
  });

  it('returns value for SetAcl type', () => {
    expect(getLogImportantData(data.setAcl, translate)).toBe('File: DEV_INO/setAcl-5243027:2:0');
  });

  it('returns value for SetAttr type', () => {
    expect(getLogImportantData(data.setAttr, translate)).toBe('File: DEV_INO/setAttr-5243027:2:0');
  });

  it('returns value for SetQuota type', () => {
    expect(getLogImportantData(data.setQuota, translate)).toBe('File: DEV_INO/setQuota-5243027:2:0');
  });
});
