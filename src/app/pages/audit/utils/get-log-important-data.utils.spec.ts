import { TranslateService } from '@ngx-translate/core';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';
import { getLogImportantData } from 'app/pages/audit/utils/get-log-important-data.utils';

const smbEntries = {
  authentication: {
    service: AuditService.Smb,
    event: AuditEvent.Authentication,
    event_data: {
      clientAccount: 'root',
    },
  } as AuditEntry,
  connect: {
    service: AuditService.Smb,
    event: AuditEvent.Connect,
    event_data: {
      host: '192.168.1.1',
    },
  } as AuditEntry,
  disconnect: {
    service: AuditService.Smb,
    event: AuditEvent.Disconnect,
    event_data: {
      host: '1.1.1.1',
    },
  } as AuditEntry,
  create: {
    service: AuditService.Smb,
    event: AuditEvent.Create,
    event_data: {
      file: {
        path: '/root/mnt/create.txt',
      },
    },
  } as AuditEntry,
  unlink: {
    service: AuditService.Smb,
    event: AuditEvent.Unlink,
    event_data: {
      file: {
        path: '/root/mnt/unlink.txt',
      },
    },
  } as AuditEntry,
  rename: {
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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
    service: AuditService.Smb,
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

const middlewareEntries = {
  authentication: {
    service: AuditService.Middleware,
    event: AuditEvent.Authentication,
    event_data: {
      credentials: {
        credentials: CredentialType.LoginPassword,
      },
    },
  } as AuditEntry,
  failedAuthentication: {
    service: AuditService.Middleware,
    event: AuditEvent.Authentication,
    event_data: {
      error: 'Some error',
      credentials: {
        credentials: CredentialType.LoginPassword,
      },
    },
  } as AuditEntry,
  methodCall: {
    service: AuditService.Middleware,
    event: AuditEvent.MethodCall,
    event_data: {
      description: 'Delete files',
    },
  } as AuditEntry,
};

const sudoEntries = {
  accept: {
    service: AuditService.Sudo,
    event: AuditEvent.Accept,
    event_data: {
      sudo: {
        accept: {
          command: '/bin/ls',
        },
      },
    },
  } as AuditEntry,
  reject: {
    service: AuditService.Sudo,
    event: AuditEvent.Reject,
    event_data: {
      sudo: {
        reject: {
          command: '/bin/ps',
        },
      },
    },
  } as AuditEntry,
};

function fakeInstant(key: string, interpolateParams: Record<string, unknown> = {}): string {
  Object.entries(interpolateParams).forEach(([param, value]) => {
    key = key.replace(`{${param}}`, String(value));
  });
  return key;
}

describe('get important data from log', () => {
  const translate = {
    instant: jest.fn((label, params) => fakeInstant(label, params)) as TranslateService['instant'],
  } as TranslateService;

  describe('SMB audit entries', () => {
    it('returns value for Authentication type', () => {
      expect(getLogImportantData(smbEntries.authentication, translate)).toBe('Account: root');
    });

    it('returns value for Connect type', () => {
      expect(getLogImportantData(smbEntries.connect, translate)).toBe('Host: 192.168.1.1');
    });

    it('returns value for Disconnect type', () => {
      expect(getLogImportantData(smbEntries.disconnect, translate)).toBe('Host: 1.1.1.1');
    });

    it('returns value for Create type', () => {
      expect(getLogImportantData(smbEntries.create, translate)).toBe('File: /root/mnt/create.txt');
    });

    it('returns value for Unlink type', () => {
      expect(getLogImportantData(smbEntries.unlink, translate)).toBe('File: /root/mnt/unlink.txt');
    });

    it('returns value for Rename type', () => {
      expect(getLogImportantData(smbEntries.rename, translate)).toBe('test.txt -> renamed.txt');
    });

    it('returns value for Close type', () => {
      expect(getLogImportantData(smbEntries.close, translate)).toBe('File: DEV_INO/close-5243027:2:0');
    });

    it('returns value for Read type', () => {
      expect(getLogImportantData(smbEntries.read, translate)).toBe('File: DEV_INO/read-5243027:2:0');
    });

    it('returns value for Write type', () => {
      expect(getLogImportantData(smbEntries.write, translate)).toBe('File: DEV_INO/write-5243027:2:0');
    });

    it('returns value for OffloadRead type', () => {
      expect(getLogImportantData(smbEntries.offloadRead, translate)).toBe('File: DEV_INO/offloadRead-5243027:2:0');
    });

    it('returns value for OffloadWrite type', () => {
      expect(getLogImportantData(smbEntries.offloadWrite, translate)).toBe('File: DEV_INO/offloadWrite-5243027:2:0');
    });

    it('returns value for SetAcl type', () => {
      expect(getLogImportantData(smbEntries.setAcl, translate)).toBe('File: DEV_INO/setAcl-5243027:2:0');
    });

    it('returns value for SetAttr type', () => {
      expect(getLogImportantData(smbEntries.setAttr, translate)).toBe('File: DEV_INO/setAttr-5243027:2:0');
    });

    it('returns value for SetQuota type', () => {
      expect(getLogImportantData(smbEntries.setQuota, translate)).toBe('File: DEV_INO/setQuota-5243027:2:0');
    });
  });

  describe('Middleware audit entries', () => {
    it('returns value for Authentication type', () => {
      expect(getLogImportantData(middlewareEntries.authentication, translate)).toBe('Credentials: Password Login');
    });

    it('returns value for failed authentication', () => {
      expect(getLogImportantData(middlewareEntries.failedAuthentication, translate)).toBe('Failed Authentication: Password Login');
    });

    it('returns value for MethodCall type', () => {
      expect(getLogImportantData(middlewareEntries.methodCall, translate)).toBe('Delete files');
    });
  });

  describe('Sudo audit entries', () => {
    it('returns value for Accept type', () => {
      expect(getLogImportantData(sudoEntries.accept, translate)).toBe('Command: /bin/ls');
    });

    it('returns value for Reject type', () => {
      expect(getLogImportantData(sudoEntries.reject, translate)).toBe('Command: /bin/ps');
    });
  });
});
