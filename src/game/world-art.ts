import canopyAsset from '@/assets/mana-canopies.png.asset.json';
import palmAsset from '@/assets/mana-palm.png.asset.json';
import deadAsset from '@/assets/mana-trees.png.asset.json';
import frontierSprites from '@/assets/frontier-sprites.png';
import { FRONTIER, type FrontierBiome } from './frontier';
import { T, TS, W, hash, tileAt } from './world';
import type { Game } from './engine';

// Original Source of Mana sprites. Artist attribution is in public/game-credits.txt.
export class WorldArt {
  canopy: HTMLImageElement;
  palm: HTMLImageElement;
  dead: HTMLImageElement;
  frontier: HTMLImageElement;
  constructor() {
    this.canopy = new Image(); this.canopy.src = canopyAsset.url;
    this.palm = new Image(); this.palm.src = palmAsset.url;
    this.dead = new Image(); this.dead.src = deadAsset.url;
    this.frontier = new Image(); this.frontier.src = frontierSprites;
  }
  frontierObject(c:CanvasRenderingContext2D,biome:FrontierBiome,tx:number,ty:number,clock:number){
    if(!this.frontier.complete||!this.frontier.naturalWidth)return;
    const d=FRONTIER[biome],i=d.art,cw=this.frontier.naturalWidth/4,ch=this.frontier.naturalHeight/2;
    const width=i===3?48:40,height=i===0||i===5?40:48;
    c.save();
    if(biome==='moonwood')c.filter='hue-rotate(95deg) saturate(.6)';
    if(biome==='lotus')c.filter='hue-rotate(35deg)';
    c.drawImage(this.frontier,(i%4)*cw,Math.floor(i/4)*ch,cw,ch,tx*TS+8-width/2+Math.sin(clock+tx)*.4,ty*TS+18-height,width,height);
    c.restore();
  }
  tree(c: CanvasRenderingContext2D, t: number, tx: number, ty: number, clock: number) {
    const x = tx * TS + 8, y = ty * TS + 16;
    const sway = Math.sin(clock * 1.5 + tx * .2) * .5;
    const palm = t === T.PALM;
    const image = palm ? this.palm : this.canopy;
    if (!image.complete || !image.naturalWidth) return;
    c.save();
    if (t === T.AUTUMN_TREE) c.filter = 'sepia(.55) saturate(1.8) hue-rotate(330deg)';
    else if (t === T.DTREE) c.filter = 'brightness(.75) hue-rotate(15deg)';
    c.globalAlpha = .22; c.fillStyle = '#172e27'; c.beginPath(); c.ellipse(x+4,y,18,7,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
    if (palm) c.drawImage(image,0,0,96,96,x-21+sway,y-43,43,43);
    else {const variant=Math.floor(hash(tx,ty,84)*5);c.drawImage(image,variant*96,0,96,128,x-22+sway,y-52,44,58);}
    c.restore();
  }
  village(c: CanvasRenderingContext2D, clock: number) {
    if (!this.canopy.complete || !this.canopy.naturalWidth) return;
    // Rich vegetation frames the original walkable village without changing collision.
    for (const [tx,ty] of [[106,116],[138,116],[105,128],[138,138],[116,140],[129,110]]) {
      this.tree(c,T.TREE,tx,ty,clock);
    }
    const x=122*TS+8,y=111*TS;
    c.save();c.globalAlpha=.2;c.fillStyle='#1b3e2d';c.beginPath();c.ellipse(x,y+3,54,14,0,0,Math.PI*2);c.fill();c.globalAlpha=1;
    c.drawImage(this.canopy,0,0,96,128,x-63,y-138,126,168);
    c.fillStyle='#c2efb6';for(let i=0;i<14;i++){const phase=clock*.8+i;c.globalAlpha=.25+Math.sin(phase)*.2;c.fillRect(x+Math.sin(phase)*44,y-35-Math.cos(phase*.7)*55,2,2);}c.restore();
  }
  ambient(g: Game, c: CanvasRenderingContext2D) {
    if (g.interior) return;
    const palette = g.biome==='autumn' ? ['#ecbe79','#cc8b6c'] : g.biome==='volcanic' ? ['#f1c080','#e79975'] : ['#d3e9b8','#bdd7ca'];
    for(let i=0;i<20;i++) {
      const x=(hash(i,3,7)*g.canvas.width+g.clock*(g.biome==='autumn'?7:2))%g.canvas.width;
      const y=(hash(i,8,9)*g.canvas.height+Math.sin(g.clock*.6+i)*12)%g.canvas.height;
      c.globalAlpha=.15+Math.sin(g.clock*1.4+i)*.12;c.fillStyle=palette[i%2];c.fillRect(x,y,i%3===0?2:1,1);
    }
    c.globalAlpha=1;
  }
}