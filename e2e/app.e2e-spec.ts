import { NgEgretPage } from './app.po';

describe('ng-egret App', () => {
  let page: NgEgretPage;

  beforeEach(() => {
    page = new NgEgretPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
