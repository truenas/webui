import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { FallbackImageDirective } from './fallback-image.directive';

describe('FallbackImageDirective', () => {
  let directive: FallbackImageDirective;

  beforeEach(() => {
    directive = new FallbackImageDirective();
  });

  it('should set imageSource to appImagePlaceholder on error', () => {
    directive.onError();
    expect(directive.imageSource).toEqual(appImagePlaceholder);
  });

  it('should set imageSource to src if src is provided', () => {
    const src = 'test.png';
    directive.src = src;
    directive.ngOnChanges();
    expect(directive.imageSource).toEqual(src);
  });

  it('should set imageSource to appImagePlaceholder if src is not provided', () => {
    directive.ngOnChanges();
    expect(directive.imageSource).toEqual(appImagePlaceholder);
  });
});
