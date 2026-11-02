/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : halftone-wave.ts
 Descrição    : Fundo verde animado: textura halftone da marca em onda, desenhada em canvas.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (animações GSAP).
──────────────────────────────────────────────────────────────────────────────
*/

import { gsap } from "./gsap";

const STEP_PX = 14;
const MAX_STEP_PX = 28;
const MAX_DOTS = 4500;
const FRAME_SECONDS = 1 / 30;
const MAX_PIXEL_RATIO = 1.5;
const MIN_RADIUS = 0.8;
const WAVE_RADIUS = 2.9;
const DOT_ALPHA = 0.3;
const POINTER_REACH_PX = 170;
const POINTER_RADIUS = 2.8;
/**
 * Quadros lentos seguidos fazem a retícula abrir, com menos pontos para desenhar; no limite dela, o fundo
 * congela. Mede o intervalo entre quadros: o `fill()` só registra comandos, e o custo real vem depois.
 */
const SLOW_GAP_SECONDS = 0.03;
const SLOW_FRAMES_LIMIT = 12;

const TAU = Math.PI * 2;

/**
 * Fundo verde em movimento: a textura halftone da marca vira uma onda, com os pontos crescendo e
 * diminuindo, e reage ao mouse. Desenha em um <canvas> a 30 quadros por segundo e só enquanto está na
 * tela. A quantidade de pontos é limitada pela área e diminui sozinha em aparelhos que não acompanham;
 * se ainda assim a página não ficar fluida, a textura para e continua como fundo estático.
 */
export function createHalftoneWave(host: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  host.append(canvas);
  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return () => undefined;
  }

  const color = getComputedStyle(document.documentElement).getPropertyValue("--color-benja-lima").trim();
  const pointerArea = host.parentElement ?? host;
  let width = 0;
  let height = 0;
  let step = STEP_PX;
  let ratio = 1;
  let visible = false;
  let last = -FRAME_SECONDS;
  let slowFrames = 0;
  let previousTick = 0;
  let frozen = false;

  // Posição do mouse com inércia e força que some ao sair, para a marca não desaparecer de repente.
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 };

  const measure = () => {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    step = Math.max(step, STEP_PX, Math.ceil(Math.sqrt((width * height) / MAX_DOTS)));
  };

  const draw = (time: number) => {
    pointer.x += (pointer.targetX - pointer.x) * 0.14;
    pointer.y += (pointer.targetY - pointer.y) * 0.14;
    pointer.strength += (pointer.targetStrength - pointer.strength) * 0.08;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;
    context.globalAlpha = DOT_ALPHA;
    context.beginPath();
    const reach = POINTER_REACH_PX * POINTER_REACH_PX;
    for (let row = 0, y = 0; y <= height + step; row += 1, y += step) {
      // Fileiras defasadas, como na retícula impressa.
      for (let x = row % 2 ? step / 2 : 0; x <= width + step; x += step) {
        const wave =
          (Math.sin(x * 0.011 + time) + Math.sin(y * 0.017 - time * 0.8) + Math.sin((x + y) * 0.007 + time * 0.45)) / 3;
        const level = (wave + 1) / 2;
        let radius = MIN_RADIUS + level * level * WAVE_RADIUS;
        if (pointer.strength > 0.01) {
          const distance = (x - pointer.x) ** 2 + (y - pointer.y) ** 2;
          if (distance < reach) radius += (1 - distance / reach) ** 2 * POINTER_RADIUS * pointer.strength;
        }
        context.moveTo(x + radius, y);
        context.arc(x, y, radius, 0, TAU);
      }
    }
    context.fill();
  };

  const watchFrameRate = (time: number) => {
    const gap = time - previousTick;
    previousTick = time;
    slowFrames = gap > SLOW_GAP_SECONDS ? slowFrames + 1 : 0;
    if (slowFrames < SLOW_FRAMES_LIMIT) return;
    slowFrames = 0;
    if (step < MAX_STEP_PX) step += 4;
    else frozen = true;
  };

  const tick = (time: number) => {
    if (!visible || frozen) return;
    watchFrameRate(time);
    if (time - last < FRAME_SECONDS) return;
    last = time;
    draw(time);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const rect = host.getBoundingClientRect();
    pointer.targetX = event.clientX - rect.left;
    pointer.targetY = event.clientY - rect.top;
    pointer.targetStrength = 1;
  };
  const onPointerLeave = () => {
    pointer.targetStrength = 0;
  };

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  const resize = new ResizeObserver(() => {
    measure();
    draw(gsap.ticker.time);
  });

  measure();
  draw(gsap.ticker.time);
  intersection.observe(host);
  resize.observe(host);
  gsap.ticker.add(tick);
  pointerArea.addEventListener("pointermove", onPointerMove, { passive: true });
  pointerArea.addEventListener("pointerleave", onPointerLeave);

  return () => {
    gsap.ticker.remove(tick);
    intersection.disconnect();
    resize.disconnect();
    pointerArea.removeEventListener("pointermove", onPointerMove);
    pointerArea.removeEventListener("pointerleave", onPointerLeave);
    canvas.remove();
  };
}
