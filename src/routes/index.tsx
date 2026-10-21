import controlSprites from "@/assets/game-control-sprites.png";
import { FRONTIER_GATES } from "@/game/frontier";
import worldArt from "@/assets/mana-world.jpg";
import { CROPS, STRUCTURES, type Tool, type CropKind, type StructureKind } from "@/game/settlement";
import { Pickaxe, Axe, Shovel, Sprout, Droplets, Hammer, House, Anvil, Save, ChevronRight, Leaf, Sun, Swords, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import { BIOME_LIST } from "@/game/world";
import { BIOME_NAMES } from "@/game/data";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Compass, Backpack, ScrollText, Map, UserRound, Volume2, VolumeX, X, Sparkles, Play, Maximize, Minimize } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUILDINGS, TREASURES } from "@/game/exploration";
import { W, H } from "@/game/world";
import { Game, VW, VH } from "@/game/engine";
import { ITEMS, QUESTS, SPIRITS, STATUES, SHOP, type Slot, type Stats } from "@/game/data";
import { drawChar, drawItemIcon } from "@/game/gfx";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mana Echoes — Crônicas de um mundo vivo" },
      { name: "description", content: "Explore Mana Quest: um mundo 16-bit com casas acessíveis, santuários secretos, tesouros, chefes e espíritos de mana." },
      { property: "og:title", content: "Mana Echoes — Crônicas de um mundo vivo" },
      { property: "og:description", content: "Explore um mundo 100 vezes maior com 30 biomas, cultive e construa seu lar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: Index,
});

type Panel = null | "inv" | "char" | "quest" | "map" | "secrets" | "workshop" | "build" | "farm";

function Icon({ id, size = 32 }: { id: string; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d"); if (!c) return;
    c.clearRect(0, 0, 32, 32); c.imageSmoothingEnabled = false;
    const it = ITEMS[id]; if (it) drawItemIcon(c, id, it.color, it.type, 0, 0, 2);
  }, [id]);
  return <canvas ref={ref} width={32} height={32} style={{ width: size, height: size, imageRendering: "pixelated" }} />;
}
function Portrait({ pal }: { pal: Parameters<typeof drawChar>[3] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext("2d"); if (!c) return;
    c.imageSmoothingEnabled = false; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 64, 64);
    c.setTransform(4, 0, 0, 4, 0, 0); drawChar(c, 8, 20, pal, 0, 0);
  }, [pal]);
  return <canvas ref={ref} width={64} height={64} className="game-frame bg-secondary" style={{ width: 80, height: 80, imageRendering: "pixelated" }} />;
}
function Bar({ v, max, cls, label }: { v: number; max: number; cls: string; label: string }) {
  return (
    <div className="status-bar">
      <div className="flex justify-between text-[11px]"><span>{label}</span><span>{Math.ceil(v)}/{max}</span></div>
      <div className="h-2 bg-background/80 border border-border"><div className={`h-full ${cls}`} style={{ width: `${Math.max(0, (v / max) * 100)}%` }} /></div>
    </div>
  );
}

function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [, setTick] = useState(0);
  const [panel, setPanel] = useState<Panel>(null);
  const [title, setTitle] = useState(true);
  const [hasSave, setHasSave] = useState(false);
  const [mapUrl, setMapUrl] = useState("");
  const [fullscreen,setFullscreen]=useState(false);
  const panelRef = useRef<Panel>(null);
  panelRef.current = panel;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const g = new Game(cv);
    gameRef.current = g;
    const resize=()=>{
      const r=cv.getBoundingClientRect(),ratio=r.width/Math.max(1,r.height);
      const width=ratio>=16/9?Math.round(270*ratio):480;
      const height=ratio>=16/9?270:Math.round(480/ratio);
      g.resize(width,height);
    };
    const observer=new ResizeObserver(resize);observer.observe(cv);resize();
    const fullChange=()=>setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange',fullChange);
    setHasSave(Game.hasSave());
    setMapUrl(g.mapDataUrl());
    g.onMapClick = () => setPanel("map");
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      g.paused = panelRef.current !== null;
      g.update(dt); g.render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const iv = setInterval(() => setTick((x) => x + 1), 120);
    const down = (e: KeyboardEvent) => {
      if (!g.started) return;
      g.audio.init();
      const toggle = (p: Panel) => setPanel((cur) => (cur === p ? null : p));
      if (e.code === "Escape") { setPanel(null); g.dialog = null; g.openStation = null; return; }
      if (e.code === "KeyI") return toggle("inv");
      if (e.code === "KeyC") return toggle("char");
      if (e.code === "KeyQ" || e.code === "KeyL") return toggle("quest");
      if (e.code === "KeyM") return toggle("map");
      if (g.dialog || g.openStation || panelRef.current) return;
      if (e.code.startsWith("Digit")) { const i = Number(e.code.slice(5)) - 1; const s = SPIRITS[i]; if (s) g.cast(s.id); }
      if (e.code === "KeyE" || e.code === "Enter") g.interact();
      if (e.code === "KeyR" || e.code === "KeyK") g.cast(g.p.spell);
      if (e.code === "KeyH") g.quickPotion();
      if (e.code === "KeyG") g.quickPotion(true);
      if (e.code === "KeyN") g.audio.toggleMute();
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      g.keys.add(e.code);
    };
    const up = (e: KeyboardEvent) => g.keys.delete(e.code);
    const blur = () => g.keys.clear(); window.addEventListener("blur",blur);
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { observer.disconnect();document.removeEventListener('fullscreenchange',fullChange);cancelAnimationFrame(raf); clearInterval(iv); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); g.audio.destroy(); window.removeEventListener("blur",blur); };
  }, []);

  const g = gameRef.current;
  const start = (load: boolean) => {
    if (!g) return;
    if (load) g.load();
    g.started = true; g.audio.init(); setTitle(false);
    if (!load) g.toast("Fale com Gorm na vila ou comece seu lar na clareira a leste.", "#ffd040");
  };
  const onMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!g || !g.started) return;
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    g.click(((e.clientX - r.left) / r.width) * g.viewWidth, ((e.clientY - r.top) / r.height) * g.viewHeight, e.button === 2);
  };

  const p = g?.p;
  const stats = g?.stats();

  return (
    <main className="game-shell min-h-screen bg-background text-foreground select-none">
      <div className={`game-layout ${title ? "at-title" : "playing"}`}>
        <div className="game-location"><span className="flex items-center gap-2"><Compass size={15} className="text-primary"/>{title ? 'Vila de Potos' : g?.areaName}<ChevronRight size={12}/><span className="text-muted-foreground">{title ? 'O início de tudo' : 'Terras de Mana'}</span></span><span className="flex items-center gap-2 text-muted-foreground"><Sun size={15}/>{title ? 'Primavera · Dia 1' : `${g?.timeLabel()} · ${g?.raining ? 'Chuva' : 'Céu aberto'}`}</span></div>
      <div className="relative w-full aspect-video game-viewport overflow-hidden">
        <canvas ref={canvasRef} aria-label="Mundo de Mana" onMouseMove={(e)=>{if(!g)return;const r=e.currentTarget.getBoundingClientRect();g.cursor={x:Math.floor(((e.clientX-r.left)/r.width*g.viewWidth+g.cam.x)/16),y:Math.floor(((e.clientY-r.top)/r.height*g.viewHeight+g.cam.y)/16)};}} onMouseDown={onMouse} onContextMenu={(e) => e.preventDefault()} className="w-full h-full block" style={{ imageRendering: "pixelated" }} />

        {g && p && stats && !title && (
          <>
            {/* HUD */}
            <div className="absolute top-2 left-2 game-panel p-2 space-y-1 text-[12px]">
              <div className="flex gap-3 text-primary"><span>Nv {p.level}</span><span>💰 {p.gold}</span><span>{g.timeLabel()}</span>{p.points > 0 && <span className="text-accent animate-pulse">+{p.points} pts</span>}</div>
              <Bar v={p.hp} max={g.maxHp()} cls="bg-destructive" label="HP" />
              <Bar v={p.mp} max={g.maxMp()} cls="bg-mana" label="MP" />
              <Bar v={p.xp} max={g.xpNeed()} cls="bg-primary" label="XP" />
            </div>
            <div className="quest-tracker absolute top-[24%] right-2 game-panel p-2 w-48 text-[11px] space-y-1">
              <div className="text-primary">SUA JORNADA</div>
              {QUESTS.filter((q) => g.questStatus[q.id] === "active").slice(0, 4).map((q) => (
                <div key={q.id}><span className={q.main ? "text-primary" : "text-accent"}>{q.main ? "★" : "!"} {q.title}</span><div className="opacity-80">{g.questReady(q) ? "✔ Retorne ao NPC" : g.questProgressText(q)}</div></div>
              ))}
              {!QUESTS.some((q) => g.questStatus[q.id] === "active") && <div className="opacity-70">Procure NPCs com "!"</div>}
            </div>
            <div className="spell-dock absolute left-1/2 -translate-x-1/2 flex gap-1">
              {SPIRITS.map((s, i) => {
                const has = p.spirits.includes(s.id);
                return (
                  <Button variant="game" key={s.id} onClick={() => has && g.cast(s.id)} title={`${s.name}: ${s.spell} (${s.mp} MP) — ${s.desc}`}
                    className={`game-panel w-14 h-14 text-[10px] flex flex-col items-center justify-center ${p.spell === s.id ? "ring-2 ring-primary" : ""} ${has ? "" : "opacity-30"}`}>
                    <span className="w-4 h-4 rounded-full" style={{ background: s.color }} />
                    <span>{i + 1}</span><span className="truncate w-full text-center">{has ? s.name : "???"}</span>
                  </Button>
                );
              })}
              <Button variant="game" className="game-panel potion-button" aria-label="Usar poção" title="Usar poção" onClick={()=>g.quickPotion()}><Icon id="potion" size={22}/><span>{g.count("potion")+g.count("hi_potion")}</span></Button>
              <Button variant="game" className="game-panel potion-button" aria-label="Usar éter" title="Usar éter" onClick={()=>g.quickPotion(true)}><Icon id="ether" size={22}/><span>{g.count("ether")}</span></Button>
            </div>
            <div className="hidden">WASD/clique mover · Espaço/clique atacar<br />1-5/R/botão dir. magia · E interagir<br />I inv · C atributos · Q missões · M mapa · N som</div>
            <div className="game-toasts absolute top-32 left-2 space-y-1">
              {g.toasts.map((t, i) => <div key={i} className="game-panel px-2 py-1 text-[11px]" style={{ color: t.color, opacity: Math.min(1, t.t) }}>{t.text}</div>)}
            </div>
            {g.biomeBanner.t > 0 && <div className="absolute top-[18%] left-1/2 -translate-x-1/2 text-primary text-lg biome-banner text-center" style={{ opacity: Math.min(1, g.biomeBanner.t) }}>{g.biomeBanner.name}</div>}
            {g.activeBoss && g.activeBoss.alive && g.activeBoss.boss && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-1/2 game-panel p-2 text-[12px]">
                <div className="flex justify-between"><span className="text-destructive">{g.activeBoss.boss.def.name}</span><span>Fase {g.activeBoss.boss.phase}</span></div>
                <div className="h-3 bg-background border border-border"><div className="h-full bg-destructive" style={{ width: `${(g.activeBoss.hp / g.activeBoss.maxhp) * 100}%` }} /></div>
              </div>
            )}

            {/* Dialog */}
            {g.dialog && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[80%] game-panel p-3 flex gap-3">
                <Portrait pal={g.dialog.npc.pal} />
                <div className="flex-1 text-[12px] space-y-2">
                  <div className="text-primary">{g.dialog.npc.name} <span className="opacity-60">— {g.dialog.npc.title}</span></div>
                  <p className="font-body text-lg leading-5">{g.dialog.text}</p>
                  <div className="flex flex-wrap gap-1">{g.dialog.choices.map((c, i) => <Button variant="game" key={i} onClick={() => { g.audio.sfx("ui"); c.act(); }} className="game-btn">{c.label}</Button>)}</div>
                </div>
              </div>
            )}

            {/* Stations */}
            {g.openStation && (
              <Modal title={g.openStation === "smith" ? "⚒ Forja de Brunhild" : g.openStation === "alchemist" ? "Alquimia de Lira" : g.openStation === "carpenter" ? "Carpintaria" : "Mercado"} onClose={() => (g.openStation = null)}>
                {g.openStation === "shop" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="text-primary mb-1">Comprar</div>{SHOP.map((id) => <Row key={id} id={id} right={`${ITEMS[id].price}g`} onClick={() => g.buy(id)} />)}</div>
                    <div><div className="text-primary mb-1">Vender (clique)</div>{g.inventory.map((s, i) => <Row key={i} id={s.id} qty={s.qty} right={`${Math.max(1, Math.floor(ITEMS[s.id].price / 2))}g`} onClick={() => g.sell(i)} />)}</div>
                  </div>
                ) : (
                  <div className="space-y-1">{g.recipes(g.openStation).map((r, i) => {
                    const ok = g.canCraft(r);
                    return (
                      <Button variant="game" key={i} onClick={() => g.craft(r)} className={`w-full flex items-center gap-2 p-1 border border-border text-left ${ok ? "hover:bg-secondary" : "opacity-50"}`}>
                        <Icon id={r.out} /><div className="flex-1"><div>{ITEMS[r.out].name}{r.qty > 1 ? ` ×${r.qty}` : ""}</div><div className="text-[10px] opacity-70">{ITEMS[r.out].desc}</div></div>
                        <div className="text-[10px] text-right">{Object.entries(r.cost).map(([id, n]) => <div key={id} className={g.count(id) >= n ? "" : "text-destructive"}>{ITEMS[id].name} {g.count(id)}/{n}</div>)}{r.gold > 0 && <div>{r.gold}g</div>}</div>
                      </Button>
                    );
                  })}</div>
                )}
              </Modal>
            )}

            {panel === "inv" && (
              <Modal title="Inventário" onClose={() => setPanel(null)}>
                <div className="flex gap-4">
                  <div className="space-y-1 w-48">{(["weapon", "armor", "ring", "amulet"] as Slot[]).map((s) => {
                    const id = p.equip[s];
                    return <Button variant="game" key={s} onClick={() => g.unequip(s)} className="w-full flex items-center gap-2 border border-border p-1 hover:bg-secondary text-left">{id ? <Icon id={id} /> : <div className="w-8 h-8" />}<div><div className="text-[10px] opacity-60">{{ weapon: "Arma", armor: "Armadura", ring: "Anel", amulet: "Amuleto" }[s]}</div><div className="text-[11px]">{id ? ITEMS[id].name : "—"}</div></div></Button>;
                  })}<div className="text-[11px] pt-2">ATQ {g.attackPower()} · DEF {g.defense()}</div></div>
                  <div className="grid grid-cols-6 gap-1 flex-1">
                    {Array.from({ length: g.INV_MAX }).map((_, i) => {
                      const s = g.inventory[i];
                      return <Button variant="game" key={i} onClick={() => s && g.equip(i)} title={s ? `${ITEMS[s.id].name} — ${ITEMS[s.id].desc}` : ""} className="relative aspect-square border border-border bg-background/50 hover:bg-secondary flex items-center justify-center">{s && <><Icon id={s.id} />{s.qty > 1 && <span className="absolute bottom-0 right-0.5 text-[10px]">{s.qty}</span>}</>}</Button>;
                    })}
                  </div>
                </div>
                <div className="text-[10px] opacity-60 mt-2">Clique para equipar/usar. Clique no equipamento para remover.</div>
              </Modal>
            )}
            {panel === "char" && (
              <Modal title={`Herói — Nível ${p.level}`} onClose={() => setPanel(null)}>
                <div className="space-y-2">
                  {([["str", "Força", "Dano corpo-a-corpo"], ["dex", "Destreza", "Arco, crítico, velocidade"], ["vit", "Vitalidade", "HP e defesa"], ["int", "Inteligência", "Magias e cajado"], ["wis", "Sabedoria", "MP, cura, regeneração"]] as [keyof Stats, string, string][]).map(([k, n, d]) => (
                    <div key={k} className="flex items-center gap-2"><span className="w-28">{n}</span><span className="w-8 text-primary">{stats[k]}</span><span className="flex-1 text-[10px] opacity-60">{d}</span><Button variant="game" disabled={p.points <= 0} onClick={() => g.allocate(k)} className="game-btn disabled:opacity-30">+</Button></div>
                  ))}
                  <div className="text-accent">Pontos: {p.points}</div>
                  <div className="text-primary pt-2">Espíritos de Mana</div>
                  {SPIRITS.map((s) => <div key={s.id} className={`text-[11px] ${p.spirits.includes(s.id) ? "" : "opacity-30"}`}><span style={{ color: s.color }}>● {s.name}</span> ({s.elem}) — {s.spell}, {s.mp} MP</div>)}
                </div>
              </Modal>
            )}
            {panel === "quest" && (
              <Modal title="Livro de Missões" onClose={() => setPanel(null)}>
                {["Principais", "Secundárias"].map((h, hi) => (
                  <div key={h} className="mb-3"><div className="text-primary mb-1">{h}</div>
                    {QUESTS.filter((q) => q.main === (hi === 0) && g.questStatus[q.id]).map((q) => (
                      <div key={q.id} className="border border-border p-2 mb-1 text-[11px]"><div>{g.questStatus[q.id] === "done" ? "✔ " : ""}{q.title}</div><div className="font-body text-base opacity-80">{q.desc}</div>{g.questStatus[q.id] === "active" && <div className="text-accent">{g.questProgressText(q)}</div>}</div>
                    ))}
                  </div>
                ))}
              </Modal>
            )}
            {panel === "map" && (
              <Modal title="Atlas de Mana — 30 biomas" onClose={() => setPanel(null)}>
                <div className="atlas-map relative w-full" style={{ aspectRatio: `${W}/${H}` }}>
                  <img src={mapUrl} alt="Mapa do mundo" className="w-full h-full" style={{ imageRendering: "pixelated" }} />
                  <div className="absolute w-2 h-2 bg-destructive animate-pulse" style={{ left: `${(p.x / 16 / W) * 100}%`, top: `${(p.y / 16 / H) * 100}%` }} />
                  {STATUES.map((s) => {
                    const on = g.statues.has(s.id);
                    return <Button variant="game" key={s.id} disabled={!on} onClick={() => { g.travel(s.id); setPanel(null); }} title={s.name} aria-label={s.name} className="atlas-marker absolute -translate-x-1/2 -translate-y-1/2 disabled:opacity-40" style={{ left: `${(s.tx / W) * 100}%`, top: `${(s.ty / H) * 100}%` }}>{on ? "◆" : "◇"}</Button>;
                  })}
                </div>
                <div className="atlas-destinations">
                  <Button variant="outline" onClick={()=>{g.travel('village');setPanel(null);}}>Vila de Potos</Button>
                  {FRONTIER_GATES.map(gate=><Button variant="outline" key={gate.id} onClick={()=>{g.travelFrontier(gate.id);setPanel(null);}}><Compass size={14}/>{gate.name}</Button>)}
                </div>
              </Modal>
            )}
          </>
        )}

        {panel === 'secrets' && g && <Modal title="Diário de Descobertas" onClose={()=>setPanel(null)}>
          <div className="grid grid-cols-2 gap-4 mb-4"><div className="text-accent">{g.discoveries.size}/{BUILDINGS.length}<div className="font-body text-xl text-foreground">Lugares visitados</div></div><div className="text-primary">{g.openedChests.size}/{TREASURES.length+BUILDINGS.length}<div className="font-body text-xl text-foreground">Tesouros encontrados</div></div></div>
          {BUILDINGS.map(b=><div key={b.id} className="flex justify-between border-b border-border/20 py-3"><span className={g.discoveries.has(b.id)?'text-accent':'text-muted-foreground'}>{g.discoveries.has(b.id)?b.name:b.secret?'??? — Lugar esquecido':b.name}</span><span>{g.discoveries.has(b.id)?'◆':'◇'}</span></div>)}
        </Modal>}
        {title && (
          <div className="title-screen absolute inset-0">
            <img src={worldArt} width={1536} height={864} alt="A Árvore de Mana, a vila e seus jardins" className="title-art"/>
            <div className="title-content">
              <div className="title-eyebrow"><span/> UM NOVO CAPÍTULO DA SUA HISTÓRIA <span/></div>
              <h1 className="game-title">Mana <em>Echoes</em></h1>
              <div className="title-subtitle">CRÔNICAS DE UM MUNDO VIVO</div>
              <p className="title-story">Entre raízes antigas e novos horizontes,<br/>uma vida inteira espera por você.</p>
              <div className="title-actions"><Button onClick={() => start(false)} className="start-button"><Play size={16} fill="currentColor"/>Nova jornada<ChevronRight size={16}/></Button>{hasSave && <Button variant="outline" onClick={()=>start(true)} className="continue-button">Continuar</Button>}</div>
              <span className="title-chapter"><Sparkles size={12}/> O mundo floresce com cada escolha.</span>
            </div>
            <span className="scene-label"><span className="world-status"/> ÁRVORE DE MANA · POTOS</span>
          </div>
        )}
        {g && !title && (panel === 'farm' || panel === 'build' || panel === 'workshop') && <Modal title={panel === 'farm' ? 'Jardim & colheita' : panel === 'build' ? 'Construir um lar' : 'Oficinas de Potos'} onClose={()=>setPanel(null)}>
          {panel === 'farm' ? <><div className="choice-grid">{(Object.entries(CROPS) as [CropKind,typeof CROPS.carrot][]).map(([id,crop])=><Button variant="outline" key={id} className="choice-item" onClick={()=>{g.crop=id;g.tool='seed';setPanel(null);}}><Sprout/><span>{crop.name}<small>{g.count(crop.seed)} sementes · {crop.seconds}s</small></span></Button>)}</div><div className="flex gap-2 mt-4"><Button variant="secondary" onClick={()=>{g.tool='till';setPanel(null);}}><Shovel/>Preparar terra</Button><Button variant="secondary" onClick={()=>{g.tool='water';setPanel(null);}}><Droplets/>Regar</Button></div><div className="progress-line mt-5">{g.settlement.plots.length} canteiros · {g.settlement.harvests} colheitas</div></> : panel === 'build' ? <div className="choice-grid">{(Object.entries(STRUCTURES) as [StructureKind,typeof STRUCTURES.home][]).map(([id,def])=><Button variant="outline" className="choice-item" key={id} onClick={()=>{g.structure=id;g.tool='build';setPanel(null);}}><House/><span>{def.name}<small>{Object.entries(def.cost).map(([key,n])=>`${ITEMS[key].name} ${g.count(key)}/${n}`).join(' · ')}</small></span></Button>)}</div> : <div className="choice-grid"><Button variant="outline" className="choice-item" onClick={()=>{g.openStation='carpenter';setPanel(null);}}><Hammer/><span>Carpintaria<small>Tábuas e materiais</small></span></Button><Button variant="outline" className="choice-item" onClick={()=>{g.openStation='smith';setPanel(null);}}><Anvil/><span>Forja<small>Lingotes, armas e armaduras</small></span></Button><Button variant="outline" className="choice-item" onClick={()=>{g.openStation='alchemist';setPanel(null);}}><Sparkles/><span>Alquimia<small>Poções e amuletos</small></span></Button><Button variant="outline" className="choice-item" onClick={()=>{g.openStation='shop';setPanel(null);}}><Backpack/><span>Mercado<small>Sementes e suprimentos</small></span></Button></div>}
        </Modal>}
      </div>
      <footer className="game-toolbar">
        <div className="toolbar-actions">{([{p:'inv',icon:Backpack,label:'Inventário'},{p:'char',icon:UserRound,label:'Herói'},{p:'quest',icon:ScrollText,label:'Missões'},{p:'map',icon:Map,label:'Mapa'},{p:'secrets',icon:Compass,label:'Descobertas'}] as const).map(({p:tab,icon:ToolIcon,label})=><Button key={tab} variant="ghost" size="icon" disabled={title} title={label} aria-label={label} onClick={()=>setPanel(panel===tab?null:tab)} className={panel===tab?'text-primary':'text-muted-foreground'}><ControlSprite name={tab}/><ToolIcon size={18}/></Button>)}<span className="toolbar-divider"/>{([{id:'explore',icon:Swords,label:'Explorar'},{id:'mine',icon:Pickaxe,label:'Minerar'},{id:'axe',icon:Axe,label:'Cortar madeira'},{id:'till',icon:Shovel,label:'Preparar terra'},{id:'water',icon:Droplets,label:'Regar'}] as const).map(({id,icon:ToolIcon,label})=><Button key={id} variant="ghost" size="icon" aria-label={label} title={label} disabled={title} onClick={()=>{if(g)g.tool=id;}} className={g?.tool===id&&!title?'tool-active':'text-muted-foreground'}><ControlSprite name={id}/><ToolIcon size={18}/></Button>)}</div>
        <div className="settlement-dock">{([{tab:'farm',name:'Cultivar',sprite:'farm'},{tab:'build',name:'Construir',sprite:'build'},{tab:'workshop',name:'Oficinas',sprite:'workshop'}] as const).map(a=><Button variant="game" size="icon" key={a.tab} disabled={title} aria-label={a.name} title={a.name} onClick={()=>setPanel(a.tab)}><ControlSprite name={a.sprite}/></Button>)}</div>
        <span className="footer-chapter">{title ? 'SUA HISTÓRIA. SEU MUNDO.' : g?.tool === 'explore' ? `${g?.settlement.structures.length} CONSTRUÇÕES · ${g?.settlement.harvests} COLHEITAS` : ({mine:'MINERAÇÃO',axe:'LENHADOR',till:'PREPARAR TERRA',seed:'PLANTAÇÃO',water:'IRRIGAÇÃO',build:'CONSTRUÇÃO'} as Record<string,string>)[g?.tool ?? '']}</span>
        <div className="system-dock flex gap-1"><Button variant="ghost" size="icon" aria-label={fullscreen?'Sair da tela cheia':'Tela cheia'} title="Tela cheia" onClick={async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{g?.toast('A tela cheia não está disponível neste navegador.');}}}>{fullscreen?<Minimize size={18}/>:<Maximize size={18}/>}</Button><Button variant="ghost" size="icon" disabled={title} title="Salvar jornada" aria-label="Salvar jornada" onClick={()=>{g?.save();g?.toast('Jornada salva.');}}><Save size={18}/></Button><Button variant="ghost" size="icon" title="Alternar áudio" aria-label="Alternar áudio" onClick={()=>g?.audio.toggleMute()}>{g?.audio.muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</Button></div>
      </footer>
      {!title && <div className="mobile-controls"><div className="direction-controls">{[{key:'KeyW',icon:ArrowUp},{key:'KeyA',icon:ArrowLeft},{key:'KeyS',icon:ArrowDown},{key:'KeyD',icon:ArrowRight}].map(({key,icon:I})=><Button variant="secondary" size="icon" key={key} aria-label={{KeyW:"Mover para cima",KeyA:"Mover para esquerda",KeyS:"Mover para baixo",KeyD:"Mover para direita"}[key]} onPointerCancel={()=>g?.keys.delete(key)} onPointerDown={(e)=>{e.currentTarget.setPointerCapture(e.pointerId);g?.keys.add(key);}} onPointerUp={()=>g?.keys.delete(key)} onPointerLeave={()=>g?.keys.delete(key)}><I/></Button>)}</div><Button variant="secondary" size="icon" aria-label="Atacar" onClick={()=>g?.attack()}><ControlSprite name="explore"/></Button><Button variant="secondary" size="icon" aria-label="Interagir" onClick={()=>g?.interact()}><Sparkles/></Button></div>}
      {title && <a className="game-credits" href="/game-credits.txt" target="_blank" rel="noreferrer">Créditos · Source of Mana</a>}
      </div>
    </main>
  );
}

const CONTROL_CELLS:Record<string,number>={inv:0,mine:1,farm:2,build:3,explore:4,map:5,workshop:6,water:7};
function ControlSprite({name}:{name:string}){
  const i=CONTROL_CELLS[name];if(i===undefined)return null;
  return <span className="control-sprite" aria-hidden="true"><img src={controlSprites} width={1152} height={576} alt="" className={`control-cell-${i}`}/></span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay absolute inset-0 bg-background/50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="game-panel modal-content p-5 w-full max-w-2xl max-h-full overflow-auto text-[12px]" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-3"><span className="text-primary text-xs">{title}</span><Button variant="game" onClick={onClose} className="game-btn" aria-label="Fechar"><X size={14}/></Button></div>
        {children}
      </div>
    </div>
  );
}
function Row({ id, qty, right, onClick }: { id: string; qty?: number; right: string; onClick: () => void }) {
  return <Button variant="game" onClick={onClick} title={ITEMS[id].desc} className="w-full flex items-center gap-2 p-1 hover:bg-secondary text-left"><Icon id={id} size={24} /><span className="flex-1 text-[11px]">{ITEMS[id].name}{qty && qty > 1 ? ` ×${qty}` : ""}</span><span className="text-primary text-[11px]">{right}</span></Button>;
}
