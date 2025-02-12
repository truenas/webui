import { TestBed } from '@angular/core/testing';
import { UrlValidationService } from './url-validation.service';

describe('UrlValidationService', () => {
  let service: UrlValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UrlValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should validate correct URLs', () => {
    const validUrls = [
      'http://example.com',
      'https://example.com',
      'https://example.com:8080/path',
      'ftp://ftp.example.com',
      'mqtt://server:1234',
      'whatever://anything',
      'ws://websocket.server',
      'wss://secure.websocket.server',
    ];

    validUrls.forEach((url) => {
      expect(service.urlRegex.test(url)).toBe(true);
    });
  });

  it('should invalidate incorrect URLs', () => {
    const invalidUrls = [
      'example.com',
      'http//invalid.com',
      '://invalid.com',
      'http://inva lid.com',
      'mqtt://server:',
      'wss://',
      'ftp://example.com:abc',
      'http:/example.com',
    ];

    invalidUrls.forEach((url) => {
      expect(service.urlRegex.test(url)).toBe(false);
    });
  });

  it('should allow URLs with ports', () => {
    expect(service.urlRegex.test('http://example.com:8080')).toBe(true);
    expect(service.urlRegex.test('mqtt://server:1883')).toBe(true);
  });

  it('should allow URLs with paths and query params', () => {
    expect(service.urlRegex.test('https://example.com/path/to/resource')).toBe(true);
    expect(service.urlRegex.test('ftp://example.com/files?name=test')).toBe(true);
  });
});
