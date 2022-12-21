import { EventEmitter } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { of } from 'rxjs';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';

/**
 * Usage:
 *
 * mockProvider(MatDialog, {
 *   open: jest.fn(() => mockEntityJobComponentRef),
 * }),
 */
export const mockEntityJobComponentRef = {
  componentInstance: {
    setDescription: jest.fn(),
    setCall: jest.fn(),
    submit: jest.fn(),
    success: of(null),
    failure: new EventEmitter(),
    wsshow: jest.fn(),
    wspost: jest.fn(),
    updateSize: jest.fn(),
  },
  close: jest.fn(),
} as unknown as MatDialogRef<EntityJobComponent>;
