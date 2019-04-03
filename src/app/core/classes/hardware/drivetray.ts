import { Container, Texture, Sprite } from 'pixi.js';

export class DriveTray {

  public container: Container;
  public background:Sprite;
  public handle: Sprite;
  public model: string;

  constructor(model){
    this.model = model;
    this.container = new PIXI.Container();
  }

  setup(){

    this.background = PIXI.Sprite.from(PIXI.loader.resources[this.model + '_drivetray_bg'].texture.baseTexture);
    this.container.addChild(this.background);

    this.handle = PIXI.Sprite.from(PIXI.loader.resources[this.model + '_drivetray_handle'].texture.baseTexture);
    this.colorize(0x5ED427);
    this.container.addChild(this.handle);
  }

  loadProgressHandler(){
    
  }

  private colorize(color: number){
    if(!this.handle){
      console.warn("Handle sprite has not been initialized");
      return;
    }

    /*let outlineFilter = new PIXI.filters.OutlineFilter(2, color);
    let filters = [outlineFilter];*/
    this.handle.tint = color;

  }

}
