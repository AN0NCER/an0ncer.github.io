import { Component } from '../utils/util.entity.js';
import { Player } from '../mod.tplayer.js';

/**
 * Upscale — компонент апскейлинга видео через anime4k-webgpu.
 *
 * Опции (из $PARAMETERS.player):
 *   upscale        {boolean}  — включить при старте
 *   upscale_mode   {string}   — 'ModeA' | 'ModeB' | 'ModeC' | 'ModeAA' | 'ModeBB' | 'ModeCA'
 *                               или одиночные модели: 'CNNx2UL' | 'GANx3L' | ...
 *
 * Регистрация в tplayer.js:
 *   import { Upscale } from './tplayer/comps/cps.upscale.js';
 *   components.add('upscale', Upscale, {
 *       enabled: $PARAMETERS.player.upscale      ?? false,
 *       mode:    $PARAMETERS.player.upscale_mode ?? 'ModeBB'
 *   });
 *
 * Публичный API:
 *   const up = player.components.list.get('upscale');
 *   up.enable()
 *   up.disable()
 *   up.toggle()
 *   up.setMode('ModeA')
 *
 *   up.on(Upscale.Events.ENABLED,     ({ mode }) => {})
 *   up.on(Upscale.Events.DISABLED,    () => {})
 *   up.on(Upscale.Events.READY,       ({ input, output }) => {})
 *   up.on(Upscale.Events.RESIZE,      ({ input, output }) => {})
 *   up.on(Upscale.Events.MODE_CHANGE, ({ mode, prev }) => {})
 */

// ── Вспомогательный WGSL шейдер (blit текстуры на canvas) ─────────────────────
const BLIT_SHADER = `
@group(0) @binding(0) var srcSampler: sampler;
@group(0) @binding(1) var srcTex: texture_2d<f32>;

struct VertexOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) idx: u32) -> VertexOut {
  var positions = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),
  );
  var uvs = array<vec2<f32>, 6>(
    vec2<f32>(0.0, 1.0), vec2<f32>(1.0, 1.0), vec2<f32>(0.0, 0.0),
    vec2<f32>(0.0, 0.0), vec2<f32>(1.0, 1.0), vec2<f32>(1.0, 0.0),
  );
  var out: VertexOut;
  out.pos = vec4<f32>(positions[idx], 0.0, 1.0);
  out.uv = uvs[idx];
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  return textureSample(srcTex, srcSampler, in.uv);
}
`;

// ── Таблица масштабов и признаков пресетов ────────────────────────────────────
const MODEL_DEFS = {
    // Upscale (меняют разрешение)
    CNNx2UL: { scale: 2, preset: false },
    CNNx2M: { scale: 2, preset: false },
    CNNx2VL: { scale: 2, preset: false },
    GANx3L: { scale: 3, preset: false },
    GANx4UUL: { scale: 4, preset: false },
    DenoiseCNNx2VL: { scale: 2, preset: false },
    // Restore / Denoise / Deblur (x1)
    GANUUL: { scale: 1, preset: false },
    CNNUL: { scale: 1, preset: false },
    CNNM: { scale: 1, preset: false },
    CNNSoftM: { scale: 1, preset: false },
    CNNSoftVL: { scale: 1, preset: false },
    CNNVL: { scale: 1, preset: false },
    BilateralMean: { scale: 1, preset: false },
    DoG: { scale: 1, preset: false },
    // Пресеты (составные пайплайны; требуют nativeDimensions/targetDimensions)
    ModeA: { scale: 2, preset: true },
    ModeB: { scale: 2, preset: true },
    ModeC: { scale: 2, preset: true },
    ModeAA: { scale: 2, preset: true },
    ModeBB: { scale: 2, preset: true },
    ModeCA: { scale: 2, preset: true },
};

export class Upscale extends Component {

    static Events = {
        ENABLED: 'upscale:enabled',
        DISABLED: 'upscale:disabled',
        READY: 'upscale:ready',
        RESIZE: 'upscale:resize',
        MODE_CHANGE: 'upscale:modechange',
        FRAME_TIME: 'upscale:frametime',
    };

    // ── Публичное состояние ───────────────────────────────────────────
    active = false;
    ready = false;
    loading = false;
    comparing = false;

    inputSize = null;
    outputSize = null;

    // ── Приватные поля ────────────────────────────────────────────────
    #canvas = null;
    #resizeObs = null;
    #lib = null;
    #reinitTimer = null;
    #rafId = null;
    #frameTimeListeners = new Set();

    // WebGPU
    #device = null;
    #context = null;
    #format = null;
    #videoTexture = null;  // { texture, width, height }
    #a4kPipeline = null;  // текущий anime4k-пайплайн
    #a4kPipelineKey = null;  // ключ, под которым он был собран
    #blitPipeline = null;
    #blitSampler = null;
    #blitBindGroupLayout = null;
    #grabCanvas = null;
    #grabCtx = null;

    // ── Lifecycle ─────────────────────────────────────────────────────

    setup() {
        this.err_code = 'COMPONENT_MEDIUM';

        if (!this.video.hasAttribute('crossorigin')) {
            this.video.crossOrigin = 'anonymous';
        }

        this.#canvas = this.#createCanvas();

        // Вспомогательный canvas для чтения кадров видео через 2D API
        this.#grabCanvas = document.createElement('canvas');
        this.#grabCtx = this.#grabCanvas.getContext('2d', { willReadFrequently: false });

        this.player.on(Player.Events.FULL_SCREEN_CHANGE, this.handle(() => {
            this.#fitCanvas();
        }));

        this.player.on(Player.Events.IOS_FULL_SCREEN_CHANGE, this.handle(() => {
            this.#fitCanvas();
        }));

        this.video.addEventListener('resize', this.handle(() => {
            if (!this.active) return;
            clearTimeout(this.#reinitTimer);
            this.#reinitTimer = setTimeout(() => this.#reinit(), 100);
        }));
    }

    init() {
        if (this.opts?.enabled) {
            this.player.on(Player.Events.LOAD_META_DATA, this.handle(async () => {
                await this.enable();
            }), { once: true });
        }
    }

    // ── Публичный API ─────────────────────────────────────────────────

    toggleCompare() {
        if (!this.active) return;
        this.comparing ? this.#showUpscale() : this.#showOriginal();
    }

    async enable() {
        if (this.active || this.loading) return;

        this.loading = true;
        this.log('Инициализация апскейла...');

        try {
            await this.#initGPU();
            await this.#loadLib();

            this.#showCanvas();
            this.active = true;
            this.loading = false;
            this.ready = true;

            const mode = this.opts?.mode ?? 'ModeBB';
            this.log(`Апскейл включён [mode=${mode}]`);
            this.trigger(Upscale.Events.ENABLED, { mode });

            this.#startRenderLoop();
            this.#fitCanvas();

            // Ждём первый кадр, чтобы узнать размеры
            this.#notifySizeOnFirstFrame();
        } catch (e) {
            this.loading = false;
            this.active = false;
            this.error?.throw('COMPONENT_MEDIUM', this.id, e);
        }
    }

    disable() {
        if (!this.active) return;

        clearTimeout(this.#reinitTimer);
        this.#stopRenderLoop();
        this.#hideCanvas();
        this.#destroyVideoTexture();
        this.#a4kPipeline = null;
        this.#a4kPipelineKey = null;
        this.#frameTimeListeners.clear();
        this.ready = false;
        this.active = false;
        this.comparing = false;

        this.log('Апскейл выключен');
        this.trigger(Upscale.Events.DISABLED);
    }

    toggle() {
        this.active ? this.disable() : this.enable();
    }

    async setMode(mode) {
        const prev = this.opts?.mode ?? 'ModeBB';
        this.opts = { ...this.opts, mode };

        this.trigger(Upscale.Events.MODE_CHANGE, { mode, prev });

        if (this.active) {
            // Сбрасываем пайплайн — он пересоберётся в следующем кадре
            this.#a4kPipeline = null;
            this.#a4kPipelineKey = null;
        }
    }

    onFrameTime(fn) {
        this.#frameTimeListeners.add(fn);
        return () => this.#frameTimeListeners.delete(fn);
    }

    // ── WebGPU инициализация ──────────────────────────────────────────

    async #initGPU() {
        if (this.#device) return; // уже инициализировано

        if (!navigator.gpu) throw new Error('WebGPU не поддерживается в этом браузере');

        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) throw new Error('GPU адаптер недоступен');

        this.#device = await adapter.requestDevice();
        this.#context = this.#canvas.getContext('webgpu');
        this.#format = navigator.gpu.getPreferredCanvasFormat();

        this.#context.configure({
            device: this.#device,
            format: this.#format,
            alphaMode: 'opaque',
        });

        // ── Blit-пайплайн (рисует текстуру на canvas) ──
        const shader = this.#device.createShaderModule({ code: BLIT_SHADER });

        this.#blitSampler = this.#device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        });

        this.#blitBindGroupLayout = this.#device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: {} },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: {} },
            ],
        });

        this.#blitPipeline = this.#device.createRenderPipeline({
            layout: this.#device.createPipelineLayout({
                bindGroupLayouts: [this.#blitBindGroupLayout],
            }),
            vertex: { module: shader, entryPoint: 'vs_main' },
            fragment: { module: shader, entryPoint: 'fs_main', targets: [{ format: this.#format }] },
            primitive: { topology: 'triangle-list' },
        });
    }

    // ── Загрузка anime4k-webgpu ───────────────────────────────────────

    async #loadLib() {
        if (this.#lib) return;
        const mod = await import('https://esm.sh/anime4k-webgpu@1.0.0');
        this.#lib = mod.default ?? mod;
    }

    // ── Рендер-луп ───────────────────────────────────────────────────

    #startRenderLoop() {
        if (this.#rafId) return;
        const loop = () => {
            if (!this.active) return;
            this.#renderFrame();
            this.#rafId = requestAnimationFrame(loop);
        };
        this.#rafId = requestAnimationFrame(loop);
    }

    #stopRenderLoop() {
        if (this.#rafId) {
            cancelAnimationFrame(this.#rafId);
            this.#rafId = null;
        }
    }

    #renderFrame() {
        const video = this.video;
        if (video.paused || video.ended || video.readyState < 2) return;

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        if (!vw || !vh) return;

        const modeKey = this.opts?.mode ?? 'ModeBB';
        const def = MODEL_DEFS[modeKey];
        const scale = def?.scale ?? 2;
        const outW = vw * scale;
        const outH = vh * scale;

        // Подгоняем canvas под выходное разрешение
        if (this.#canvas.width !== outW || this.#canvas.height !== outH) {
            this.#canvas.width = outW;
            this.#canvas.height = outH;
            this.#fitCanvas();

            const prevOutput = this.outputSize;
            this.inputSize = { width: vw, height: vh };
            this.outputSize = { width: outW, height: outH };

            if (!prevOutput || prevOutput.width !== outW || prevOutput.height !== outH) {
                this.trigger(Upscale.Events.RESIZE, {
                    input: this.inputSize,
                    output: this.outputSize,
                });
            }
        }

        // Читаем текущий кадр видео через 2D canvas → загружаем в GPU-текстуру
        if (this.#grabCanvas.width !== vw || this.#grabCanvas.height !== vh) {
            this.#grabCanvas.width = vw;
            this.#grabCanvas.height = vh;
        }
        this.#grabCtx.drawImage(video, 0, 0, vw, vh);

        const vt = this.#ensureVideoTexture(vw, vh);

        this.#device.queue.copyExternalImageToTexture(
            { source: this.#grabCanvas },
            { texture: vt.texture },
            [vw, vh],
        );
        
        // Собираем anime4k-пайплайн (если нужно)
        const pipe = this.#ensureA4kPipeline(modeKey, vw, vh, scale, vt);

        // ── Замер времени ──
        const t0 = performance.now();
        
        if (pipe) {
            // Прогоняем anime4k
            const encoder = this.#device.createCommandEncoder();
            pipe.pass(encoder);
            this.#device.queue.submit([encoder.finish()]);
            
            // Blit результата на canvas
            this.#blit(pipe.getOutputTexture().createView());
        } else {
            // Fallback — просто рисуем оригинал
            this.#blit(vt.texture.createView());
        }
        
        this.#device.queue.onSubmittedWorkDone().then(() => {
            this.#notifyFrameTime(performance.now() - t0);
        });
    }

    // ── Вспомогательные GPU-методы ────────────────────────────────────

    #ensureVideoTexture(w, h) {
        if (this.#videoTexture && this.#videoTexture.width === w && this.#videoTexture.height === h) {
            return this.#videoTexture;
        }
        this.#destroyVideoTexture();
        this.#a4kPipeline = null; // при смене размера пересобрать пайплайн
        this.#a4kPipelineKey = null;

        const texture = this.#device.createTexture({
            size: [w, h],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.#videoTexture = { texture, width: w, height: h };
        return this.#videoTexture;
    }

    #destroyVideoTexture() {
        if (this.#videoTexture) {
            this.#videoTexture.texture.destroy();
            this.#videoTexture = null;
        }
    }

    #ensureA4kPipeline(modeKey, vw, vh, scale, vt) {
        if (this.#a4kPipelineKey === modeKey && this.#a4kPipeline) {
            return this.#a4kPipeline;
        }

        const cls = this.#lib?.[modeKey];
        if (!cls) {
            this.log(`Неизвестная модель: ${modeKey}`);
            return null;
        }

        const def = MODEL_DEFS[modeKey];
        try {
            if (def?.preset) {
                this.#a4kPipeline = new cls({
                    device: this.#device,
                    inputTexture: vt.texture,
                    nativeDimensions: { width: vw, height: vh },
                    targetDimensions: { width: vw * scale, height: vh * scale },
                });
            } else {
                this.#a4kPipeline = new cls({
                    device: this.#device,
                    inputTexture: vt.texture,
                });
            }
            this.#a4kPipelineKey = modeKey;
            this.log(`Пайплайн ${modeKey} собран`);
        } catch (err) {
            this.#a4kPipeline = null;
            this.#a4kPipelineKey = null;
            this.error?.throw('COMPONENT_MEDIUM', this.id, err);
        }
        return this.#a4kPipeline;
    }

    #blit(textureView) {
        const encoder = this.#device.createCommandEncoder();
        const canvasView = this.#context.getCurrentTexture().createView();

        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: canvasView,
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });

        const bindGroup = this.#device.createBindGroup({
            layout: this.#blitBindGroupLayout,
            entries: [
                { binding: 0, resource: this.#blitSampler },
                { binding: 1, resource: textureView },
            ],
        });

        pass.setPipeline(this.#blitPipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
        pass.end();

        this.#device.queue.submit([encoder.finish()]);
    }

    // ── Canvas управление ─────────────────────────────────────────────

    #createCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'upscale-canvas';
        canvas.style.cssText = `
            position: absolute;
            display: none;
            pointer-events: none;
            z-index: 1;
        `;
        this.player.root.style.position = 'relative';
        this.player.root.appendChild(canvas);
        return canvas;
    }

    #showCanvas() {
        this.video.style.opacity = '0';
        this.#fitCanvas();

        this.#resizeObs?.disconnect();
        this.#resizeObs = new ResizeObserver(() => this.#fitCanvas());
        this.#resizeObs.observe(this.player.root);
    }

    #hideCanvas() {
        this.#resizeObs?.disconnect();
        this.#resizeObs = null;
        this.#canvas.style.display = 'none';
        this.video.style.opacity = '1';
        this.comparing = false;
    }

    #fitCanvas() {
        if (!this.#canvas || (!this.active && !this.loading)) return;

        const cw = this.player.root.clientWidth;
        const ch = this.player.root.clientHeight;
        const vw = this.#canvas.width;
        const vh = this.#canvas.height;

        if (!vw || !vh) return;

        const scale = Math.min(cw / vw, ch / vh);
        const w = Math.round(vw * scale);
        const h = Math.round(vh * scale);
        const x = Math.round((cw - w) / 2);
        const y = Math.round((ch - h) / 2);

        this.#canvas.style.cssText = `
            position: absolute;
            display: block;
            pointer-events: none;
            z-index: 1;
            width: ${w}px;
            height: ${h}px;
            left: ${x}px;
            top: ${y}px;
        `;
    }

    #showOriginal() {
        this.comparing = true;
        this.#canvas.style.display = 'none';
        this.video.style.opacity = '1';
    }

    #showUpscale() {
        this.comparing = false;
        this.video.style.opacity = '0';
        this.#canvas.style.display = 'block';
    }

    // ── Вспомогательные методы ────────────────────────────────────────

    /** Триггерим READY и обновляем размеры после первого нормального кадра */
    #notifySizeOnFirstFrame() {
        const check = () => {
            const vw = this.video.videoWidth;
            const vh = this.video.videoHeight;
            if (!vw || !vh) {
                requestAnimationFrame(check);
                return;
            }
            const modeKey = this.opts?.mode ?? 'ModeBB';
            const scale = MODEL_DEFS[modeKey]?.scale ?? 2;
            this.inputSize = { width: vw, height: vh };
            this.outputSize = { width: vw * scale, height: vh * scale };
            this.trigger(Upscale.Events.READY, {
                input: this.inputSize,
                output: this.outputSize,
            });
        };
        requestAnimationFrame(check);
    }

    async #reinit() {
        this.#stopRenderLoop();
        this.#destroyVideoTexture();
        this.#a4kPipeline = null;
        this.#a4kPipelineKey = null;
        this.ready = false;

        // Даём браузеру несколько кадров «выдохнуть»
        await new Promise(r => {
            let i = 0;
            const tick = () => (++i < 4) ? requestAnimationFrame(tick) : r();
            requestAnimationFrame(tick);
        });

        try {
            // GPU уже инициализирован — просто перезапускаем луп
            this.#startRenderLoop();
            this.ready = true;
            this.log('[reinit done]');
        } catch (e) {
            this.active = false;
            this.#hideCanvas();
            this.error?.throw('COMPONENT_MEDIUM', this.id, e);
        }
    }

    #notifyFrameTime(ms) {
        if (!this.#frameTimeListeners.size) return;
        for (const fn of this.#frameTimeListeners) fn(ms);
    }

    destroy() {
        clearTimeout(this.#reinitTimer);
        this.disable();
        this.#resizeObs?.disconnect();

        // Освобождаем GPU-ресурсы
        this.#destroyVideoTexture();
        this.#device?.destroy();
        this.#device = null;

        this.#canvas?.remove();
        this.#frameTimeListeners.clear();
    }
}

/**
 * Доступные режимы (пресеты из anime4k-webgpu):
 *
 * ModeA  — Restore → Upscale                                        (быстрый)
 * ModeB  — Restore → Upscale → Restore                              (средний)
 * ModeC  — Upscale → Upscale                                        (без restore)
 * ModeAA — Restore → Upscale → Restore → Upscale                    (высокий)
 * ModeBB — Restore → Upscale → Restore → Upscale → Restore          (максимальный)
 * ModeCA — Upscale → Upscale → Restore                              (баланс)
 *
 * Одиночные модели: CNNx2UL, CNNx2M, CNNx2VL, GANx3L, GANx4UUL,
 *   DenoiseCNNx2VL, GANUUL, CNNUL, CNNM, CNNSoftM, CNNSoftVL, CNNVL,
 *   BilateralMean, DoG
 */

/**
 * Мод для управлением Upscale в ui плеере
 */

export class UpscaleUI extends Component {
    setup({ io } = {}) {
        /**@type {Upscale} */
        this.io = this.player.components.list.get(io);
        this.player.root.querySelector('.r-controlls > .quality-wrapper-btn')
            .insertAdjacentHTML('beforebegin', `<div class="upscale-wrapper-btn"><div class="open-upscale" id="media-upscale-button" >Ai</div></div>`);
        this.player.root.querySelector('.video-controller-wrapper')
            .insertAdjacentHTML('beforeend', `<div class="interactive quality-selector -hide" id="media-upscale-interactive"><div class="upscale-edit-wrapper"><div class="current-quality" data-source="quality">Ai:${this.io.opts.mode}</div><div class="btn-wrapper" id="media-upscale-switch-button"><div class="icon"><svg viewBox="0 0 640 640" aria-hidden="true"><use href="#i-eye" class="true"></use><use href="#i-eye-slash" class="false"></use></svg></div><div class="true">Показано</div><div class="false">Скрыто</div></div><div class="list-info-wrapper"><div class="info-upscale">Upscale</div><div class="info-upscale-value" id="media-upscale-x"><span class="value">${MODEL_DEFS[this.io.opts.mode].scale}</span>x</div></div><div class="list-info-wrapper"><div class="info-upscale">State</div><div class="info-upscale-value" id="media-upscale-ms"><span class="value">0</span> ms</div><div class="info-upscale-value" id="media-upscale-fps"><span class="value">0</span> fps</div></div><div class="btn w48 h48" id="media-close-upscale"><svg viewBox="0 0 640 640" aria-hidden="true"><use href="#i-xmark"></use></svg></div></div></div>`);
    }
    init() {
        const interactive = document.querySelector('#media-upscale-interactive');
        const ms_val = interactive.querySelector('#media-upscale-ms > .value');
        const fps = interactive.querySelector('#media-upscale-fps > .value');

        let off = () => { };
        let animId = undefined;

        this.io.on(Upscale.Events.RESIZE, ({ input, output }) => {
            console.log('Video resized from:', input, 'to:', output);
        });

        //Кнопка в элементе управление (получаем из document обязательно)
        document.querySelector('#media-upscale-button').addEventListener('click', () => {
            off = this.io.onFrameTime(ms => {
                try {
                    if (animId) return;

                    const loop = () => {
                        ms_val.innerText = `${ms.toFixed()}`;
                        ms_val.style.color = getColor(ms);
                        fps.innerText = `${(1000 / ms).toFixed()}`;
                        animId = undefined;
                    };

                    animId = requestAnimationFrame(loop);
                } catch (err) {
                    console.log(err)
                }
            });

            interactive.classList.remove('-hide');
        });

        interactive.querySelector('#media-close-upscale').addEventListener('click', () => {
            off();

            interactive.classList.add('-hide');
        });

        const switch_btn = interactive.querySelector('#media-upscale-switch-button');

        switch_btn.addEventListener('click', () => {
            this.io.toggleCompare();

            if (this.io.comparing) {
                switch_btn.classList.add('-hide');
            } else {
                switch_btn.classList.remove('-hide');
            }
        });

        function getColor(ms) {
            const max = 50;

            const t = Math.min(ms / max, 1);

            const r = Math.round(255 * t);
            const g = Math.round(255 * (1 - t));

            return `rgb(${r}, ${g}, 0)`;
        }
    }
}