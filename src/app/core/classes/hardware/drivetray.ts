import { Container, Texture, Sprite } from 'pixi.js';

export class DriveTray {

  //public container: Sprite; // Alias for background sprite
  public container: Container; // Alias for background sprite
  public background:Sprite;
  public handle: Sprite;
  public model: string;
  public id: string;

  private _color: string;
  get color(){
    return this._color;
  }
  set color(value){
    this._color = value;
    this.colorize(value);
  }

  constructor(model){
    this.model = model;
    this.container = new PIXI.Container();
  }

  setup(){

    this.background = PIXI.projection.Sprite2d.from(PIXI.loader.resources[this.model + '_drivetray_bg'].texture.baseTexture);
    //this.container = this.background; // Convenient Alias
    this.container.addChild(this.background);

    this.handle = PIXI.Sprite.from(PIXI.loader.resources[this.model + '_drivetray_handle'].texture.baseTexture);
    //this.colorize("#5ED427");
    this.container.addChild(this.handle);
  }

  loadProgressHandler(){
    
  }

  private colorize(cssColor: string ){
    if(!this.handle){
      console.warn("Handle sprite has not been initialized");
      return;
    }

    let color = cssColor.toUpperCase().replace("#", "0x");

    /*let outlineFilter = new PIXI.filters.OutlineFilter(2, color);
    let filters = [outlineFilter];*/
    this.handle.tint = Number(color);

  }

}
