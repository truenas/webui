import { Container, Texture, Sprite } from 'pixi.js';

export class DriveTray {

  //public container: Sprite; // Alias for background sprite
  public container: Container; // Alias for background sprite
  public background:Sprite;
  public handle: Sprite;
  public model: string;
  public id: string;
  protected loader;

  public enabled: boolean = false;

  private _color: string;
  get color(){
    return this._color;
  }
  set color(value){
    //this._color = value;
    this.colorize(value);
  }

  constructor(model, loader){
    this.model = model;
    this.loader = loader;
    this.container = new PIXI.Container();
  }

  setup(){

    this.background = PIXI.projection.Sprite2d.from(this.loader.resources[this.model + '_drivetray_bg'].texture.baseTexture);
    //this.container = this.background; // Convenient Alias
    this.container.addChild(this.background);

    this.handle = PIXI.Sprite.from(this.loader.resources[this.model + '_drivetray_handle'].texture.baseTexture);
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

    this._color = cssColor;
    if(cssColor == 'none'){
      this.handle.tint = 0xFFFFFF;
      //this._color = '#ffffff';
    } else {
      //this._color = cssColor;
      let color = parseInt("0x" + cssColor.substring(1), 16);

      /*let outlineFilter = new PIXI.filters.OutlineFilter(2, color);
      let filters = [outlineFilter];*/
      this.handle.tint = color;
    }

  }

}
