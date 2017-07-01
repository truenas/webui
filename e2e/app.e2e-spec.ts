import {FreenasPage} from './app.po';

describe('freenas App', () => {
  let page: FreenasPage;

  beforeEach(() => { page = new FreenasPage(); });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
