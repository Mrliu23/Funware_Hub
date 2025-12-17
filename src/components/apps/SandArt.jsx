import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Palette, Trash2, LayoutGrid, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 画布尺寸
const WIDTH = 80;
const HEIGHT = 140;
const EMPTY = 0;
const WALL = 1;
const SAND = 2; // >= 2 代表不同颜色的沙子

// 12种流行颜色
const COLORS = [
    { id: 0, color: '#ef4444', hue: 0, s: 80, l: 60 },      // Red
    { id: 1, color: '#f97316', hue: 25, s: 90, l: 60 },     // Orange
    { id: 2, color: '#eab308', hue: 50, s: 90, l: 50 },     // Yellow
    { id: 3, color: '#84cc16', hue: 80, s: 80, l: 60 },     // Lime
    { id: 4, color: '#22c55e', hue: 140, s: 80, l: 50 },    // Green
    { id: 5, color: '#06b6d4', hue: 190, s: 80, l: 60 },    // Cyan
    { id: 6, color: '#3b82f6', hue: 220, s: 90, l: 60 },    // Blue
    { id: 7, color: '#8b5cf6', hue: 260, s: 80, l: 65 },    // Violet
    { id: 8, color: '#d946ef', hue: 300, s: 80, l: 60 },    // Fuchsia
    { id: 9, color: '#f43f5e', hue: 340, s: 90, l: 60 },    // Rose
    { id: 10, color: '#ffffff', hue: 0, s: 0, l: 100 },     // White
    { id: 11, color: '#78716c', hue: 30, s: 10, l: 50 },    // Stone
];

// 形状定义 (返回 x,y 是否在形状内)
// 坐标系: x: 0-WIDTH, y: 0-HEIGHT
const SHAPES = [
    {
        id: 'free', name: '自由画布', icon: '🎨',
        isInside: (x, y) => true
    },
    {
        id: 'heart', name: '爱心', icon: '❤️',
        isInside: (x, y) => {
            // Heart formula visualization
            // Scale coords to -1.5 to 1.5
            const u = (x - WIDTH / 2) / (WIDTH / 2.5);
            const v = -(y - HEIGHT / 2) / (WIDTH / 2.5); // Flip Y
            // (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
            const a = u * u + v * v - 1;
            return a * a * a - u * u * v * v * v <= 0;
        }
    },
    {
        id: 'circle', name: '星球', icon: '🌍',
        isInside: (x, y) => {
            const dx = x - WIDTH / 2;
            const dy = y - HEIGHT / 2;
            return dx * dx + dy * dy <= (WIDTH / 2.2) * (WIDTH / 2.2);
        }
    },
    {
        id: 'star', name: '星星', icon: '⭐',
        isInside: (x, y) => {
            // Simple approach: combine triangles or math
            const cx = WIDTH / 2;
            const cy = HEIGHT / 2;
            const r = WIDTH / 2.2;
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            // 5-point star polar equation aprox
            const starR = r * (0.6 + 0.4 * Math.cos(5 * angle)); // visual approx
            return dist <= starR;
        }
    },
    {
        id: 'tree', name: '松树', icon: '🌲',
        isInside: (x, y) => {
            // Triangle top + Rect trunk
            const cx = WIDTH / 2;
            // Trunk
            if (Math.abs(x - cx) < WIDTH * 0.1 && y > HEIGHT * 0.7 && y < HEIGHT * 0.9) return true;
            // Layers of leaves (Triangles)
            const branch = (ty, h, w) => {
                if (y < ty || y > ty + h) return false;
                const halfW = w * ((y - ty) / h);
                return Math.abs(x - cx) < halfW;
            };
            // Inverted logic for "point up" triangle: width grows as Y increases? No, Y increases downwards here.
            // Let's use simple math:
            // Top: y=20, Bottom: y=100
            if (y < 20 || y > 120) return false;
            // Multi-triangles? Or just one big one for simplicity
            const dx = Math.abs(x - cx);
            const maxW = (y - 20) * 0.6;
            if (y < 100 && dx < maxW) return true;
            return false;
        }
    },
    {
        id: 'hourglass', name: '沙漏', icon: '⏳',
        isInside: (x, y) => {
            const cx = WIDTH / 2;
            const cy = HEIGHT / 2;
            const dx = Math.abs(x - cx);
            const dy = Math.abs(y - cy);
            if (dy > HEIGHT / 2.2) return false;
            // x width corresponds to y distance from center
            return dx < dy * 0.8 + 2;
        }
    },
    {
        id: 'cat', name: '猫咪', icon: '🐱',
        isInside: (x, y) => {
            // Simple Bitmap for Cat is implemented by overriding below
            return false;
        },
        // Override with bitmap check in Init
        useBitmap: true
    }
];

// Re-implementing Cat using pure math shapes for robustness
SHAPES.find(s => s.id === 'cat').isInside = (x, y) => {
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2 + 10;

    // Head: Circle
    const headR = 25;
    const headY = cy;
    if ((x - cx) * (x - cx) + (y - headY) * (y - headY) < headR * headR) return true;

    // Ears: Triangles relative to head
    // Left
    if (y < headY - 10 && x < cx - 10) {
        // Line eq: y = -2x ... roughly
        // Simple distinct triangle check
        if (y > headY - 35 && Math.abs(x - (cx - 18)) < (y - (headY - 40))) return true;
    }
    // Right
    if (y < headY - 10 && x > cx + 10) {
        if (y > headY - 35 && Math.abs(x - (cx + 18)) < (y - (headY - 40))) return true;
    }
    return false;
};

const LS_KEY_PREFIX = 'sand_art_state_';

const SandArt = ({ onClose }) => {
    const canvasRef = useRef(null);
    const gridRef = useRef(new Int32Array(WIDTH * HEIGHT).fill(EMPTY));
    const animationFrameRef = useRef(null);

    // UI State
    const [mode, setMode] = useState('MENU'); // MENU, DRAWING
    const [currentShape, setCurrentShape] = useState(SHAPES[0]); // Default
    const [selectedColor, setSelectedColor] = useState(COLORS[6]); // Default Blue
    const [brushSize, setBrushSize] = useState(2); // 画笔粗细 1-5
    const [gravity, setGravity] = useState({ x: 0, y: 1 });
    const [showPalette, setShowPalette] = useState(false);
    const [showBrushPanel, setShowBrushPanel] = useState(false);

    const isTouching = useRef(false);
    const touchPos = useRef({ x: 0, y: 0 });

    // Refs for persistence to access inside cleanup
    const modeRef = useRef('MENU');
    const shapeRef = useRef(SHAPES[0]);

    useEffect(() => {
        modeRef.current = mode;
        shapeRef.current = currentShape;
    }, [mode, currentShape]);

    // 初始化：重力传感器
    useEffect(() => {
        const handleOrientation = (event) => {
            const g = event.gamma || 0;
            const b = event.beta || 0;
            const x = Math.max(-1, Math.min(1, g / 45));
            const y = Math.max(-1, Math.min(1, b / 45));
            setGravity({ x, y });
        };
        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            // Unmount Cleanup: Save current template state
            if (modeRef.current === 'DRAWING') {
                saveState(shapeRef.current.id);
            }
        };
    }, []);

    const saveState = (shapeIdToSave) => {
        const targetShapeId = shapeIdToSave || shapeRef.current.id;
        try {
            const data = {
                grid: Array.from(gridRef.current)
            };
            localStorage.setItem(LS_KEY_PREFIX + targetShapeId, JSON.stringify(data));
        } catch (e) {
            console.warn("Save failed:", e);
        }
    };

    // 手动清空当前模板存档
    const handleClear = () => {
        const grid = gridRef.current;
        // Keep walls, clear sand
        for (let i = 0; i < grid.length; i++) {
            if (grid[i] >= SAND) grid[i] = EMPTY;
        }
        // Remove only current template's save
        localStorage.removeItem(LS_KEY_PREFIX + shapeRef.current.id);
    };

    // 返回菜单（保存当前状态）
    const handleBackToMenu = () => {
        if (modeRef.current === 'DRAWING') {
            saveState(shapeRef.current.id);
        }
        setMode('MENU');
    };

    // 退出程序（保存当前状态）
    const handleExit = () => {
        if (modeRef.current === 'DRAWING') {
            saveState(shapeRef.current.id);
        }
        onClose();
    };

    const startGame = (shape) => {
        // 1. 保存当前模板的状态（如果正在绘图模式）
        if (modeRef.current === 'DRAWING') {
            saveState(shapeRef.current.id);
        }

        setCurrentShape(shape);
        const grid = gridRef.current;

        // 2. 尝试加载新模板的存档
        let loaded = false;
        try {
            const saved = localStorage.getItem(LS_KEY_PREFIX + shape.id);
            if (saved) {
                const data = JSON.parse(saved);
                if (data && data.grid && data.grid.length === WIDTH * HEIGHT) {
                    gridRef.current = Int32Array.from(data.grid);
                    loaded = true;
                }
            }
        } catch (e) {
            console.warn("Failed to load template state:", e);
        }

        // 3. 如果没有存档，初始化新模板
        if (!loaded) {
            // 清空画布
            grid.fill(EMPTY);

            // 应用形状遮罩
            if (shape.id !== 'free') {
                for (let y = 0; y < HEIGHT; y++) {
                    for (let x = 0; x < WIDTH; x++) {
                        const idx = y * WIDTH + x;
                        if (!shape.isInside(x, y)) {
                            gridRef.current[idx] = WALL;
                        }
                    }
                }
            }
        }

        setMode('DRAWING');
    };

    // 物理循环
    useEffect(() => {
        if (mode !== 'DRAWING') return;

        const grid = gridRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        const update = () => {
            // 0. 生成沙子
            if (isTouching.current) {
                const { x, y } = touchPos.current;
                const rect = canvas.getBoundingClientRect();
                const gx = Math.floor(((x - rect.left) / rect.width) * WIDTH);
                const gy = Math.floor(((y - rect.top) / rect.height) * HEIGHT);

                const brushR = brushSize;
                for (let dy = -brushR; dy <= brushR; dy++) {
                    for (let dx = -brushR; dx <= brushR; dx++) {
                        const nx = gx + dx;
                        const ny = gy + dy;
                        // 圆形笔刷
                        if (dx * dx + dy * dy <= brushR * brushR) {
                            if (nx >= 0 && nx < WIDTH && ny >= 0 && ny < HEIGHT) {
                                // 只有 EMPTY 才能放沙子 (WALL 挡住)
                                if (grid[ny * WIDTH + nx] === EMPTY) {
                                    grid[ny * WIDTH + nx] = 2000 + selectedColor.id;
                                }
                            }
                        }
                    }
                }
            }

            // 1. 物理更新
            let dir = Math.random() > 0.5 ? 1 : -1;
            if (gravity.x > 0.15) dir = 1;
            if (gravity.x < -0.15) dir = -1;

            for (let y = HEIGHT - 1; y >= 0; y--) {
                const startX = Math.random() > 0.5 ? 0 : WIDTH - 1;
                const step = startX === 0 ? 1 : -1;

                for (let i = 0; i < WIDTH; i++) {
                    const x = startX + i * step;
                    const idx = y * WIDTH + x;
                    const cell = grid[idx];

                    if (cell >= SAND) {
                        const below = (y + 1) * WIDTH + x;

                        // 重力影响滑落概率
                        if (y < HEIGHT - 1) {
                            if (grid[below] === EMPTY) {
                                grid[below] = cell;
                                grid[idx] = EMPTY;
                            } else {
                                // 侧滑
                                const dx = dir;
                                const sideBelow = (y + 1) * WIDTH + (x + dx);
                                const otherSideBelow = (y + 1) * WIDTH + (x - dx);

                                if (x + dx >= 0 && x + dx < WIDTH && grid[sideBelow] === EMPTY) {
                                    grid[sideBelow] = cell;
                                    grid[idx] = EMPTY;
                                } else if (x - dx >= 0 && x - dx < WIDTH && grid[otherSideBelow] === EMPTY) {
                                    // 甚至偶尔允许反向滑落
                                    if (Math.random() > 0.2) {
                                        grid[otherSideBelow] = cell;
                                        grid[idx] = EMPTY;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // 2. 渲染
            const imgData = ctx.createImageData(WIDTH, HEIGHT);
            const data = imgData.data;

            for (let i = 0; i < grid.length; i++) {
                const cell = grid[i];
                if (cell >= SAND) {
                    const colorId = cell - 2000;
                    // Find actual color RGB 
                    const colorDef = COLORS.find(c => c.id === colorId) || COLORS[0];
                    const h = colorDef.hue;
                    const s = colorDef.s;
                    const l = colorDef.l;
                    // HSL to RGB inline
                    const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
                    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                    const m = l / 100 - c / 2;
                    let r, g, b;
                    if (h < 60) { r = c; g = x; b = 0 } else if (h < 120) { r = x; g = c; b = 0 } else if (h < 180) { r = 0; g = c; b = x } else if (h < 240) { r = 0; g = x; b = c } else if (h < 300) { r = x; g = 0; b = c } else { r = c; g = 0; b = x }

                    data[i * 4] = (r + m) * 255; data[i * 4 + 1] = (g + m) * 255; data[i * 4 + 2] = (b + m) * 255; data[i * 4 + 3] = 255;
                } else if (cell === WALL) {
                    if (currentShape.id !== 'free') {
                        data[i * 4] = 20; data[i * 4 + 1] = 20; data[i * 4 + 2] = 20; data[i * 4 + 3] = 200; // 暗色背景遮罩
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);
            animationFrameRef.current = requestAnimationFrame(update);
        };

        animationFrameRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [mode, selectedColor, brushSize, gravity, currentShape]);

    const handlePointerAction = (active, e) => {
        isTouching.current = active;
        if (active && e) updateTouchPos(e);
    };

    const updateTouchPos = (e) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        touchPos.current = { x: clientX, y: clientY };
    };

    return (
        <div className="h-full bg-black flex flex-col items-center justify-center relative overflow-hidden touch-none select-none">
            {/* 全局背景图或模糊效果 */}
            <div className="absolute inset-0 bg-neutral-900 z-0" />

            {/* Mode selection Menu */}
            {mode === 'MENU' && (
                <div className="z-10 w-full h-full flex flex-col p-8 animate-in fade-in slide-in-from-bottom-10 duration-500">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={onClose} className="p-2 bg-neutral-800 rounded-full text-neutral-400">
                            <ArrowLeft size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-neutral-200">选择画布</h2>
                        <div className="w-10" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 overflow-y-auto pb-4">
                        {SHAPES.map(shape => (
                            <button
                                key={shape.id}
                                onClick={() => startGame(shape)}
                                className="aspect-[4/5] bg-neutral-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:bg-neutral-700 active:scale-95 transition-all border border-neutral-700 hover:border-neutral-500"
                            >
                                <div className="text-6xl">{shape.icon}</div>
                                <span className="text-neutral-300 font-bold">{shape.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Drawing Canvas */}
            {mode === 'DRAWING' && (
                <>
                    {/* 顶部返回 (保存并退出) */}
                    <div className="absolute top-4 left-4 z-20">
                        <button onClick={handleExit} className="p-2 bg-white/10 rounded-full shadow-sm text-white backdrop-blur-md active:scale-95 transition-transform">
                            <ArrowLeft size={24} />
                        </button>
                    </div>

                    {/* 右上角工具栏 */}
                    <div className="absolute top-4 right-4 z-20 flex gap-2">
                        {/* 切换画布 (保存并返回菜单) */}
                        <button
                            onClick={handleBackToMenu}
                            className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-95 transition-transform"
                        >
                            <LayoutGrid size={24} />
                        </button>

                        {/* 清空 */}
                        <button
                            onClick={handleClear}
                            className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md active:scale-95 transition-transform"
                        >
                            <Trash2 size={24} />
                        </button>

                        {/* 颜色选择触发 */}
                        <button
                            onClick={() => setShowPalette(!showPalette)}
                            className="p-2 w-10 h-10 rounded-full shadow-sm border-2 border-white/50 backdrop-blur-md active:scale-95 transition-transform"
                            style={{ backgroundColor: selectedColor.color }}
                        />
                        {/* 画笔粗细按钮 */}
                        <button
                            onClick={() => { setShowBrushPanel(!showBrushPanel); setShowPalette(false); }}
                            className="p-2 w-10 h-10 rounded-full shadow-sm border-2 border-white/50 backdrop-blur-md active:scale-95 transition-transform bg-white/10 flex items-center justify-center"
                        >
                            <div
                                className="rounded-full bg-white"
                                style={{ width: `${8 + brushSize * 4}px`, height: `${8 + brushSize * 4}px` }}
                            />
                        </button>
                    </div>

                    <div className="w-full h-full relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
                        <canvas
                            ref={canvasRef}
                            width={WIDTH}
                            height={HEIGHT}
                            className="w-full h-full object-contain image-pixelated pointer-events-auto"
                            style={{ imageRendering: 'pixelated' }}
                            onMouseDown={(e) => handlePointerAction(true, e)}
                            onMouseUp={() => handlePointerAction(false)}
                            onMouseMove={(e) => { if (isTouching.current) updateTouchPos(e); }}
                            onTouchStart={(e) => handlePointerAction(true, e)}
                            onTouchEnd={() => handlePointerAction(false)}
                            onTouchMove={(e) => { if (isTouching.current) updateTouchPos(e); }}
                        />
                    </div>

                    {/* 颜色选择器面板 - 下拉式 */}
                    <AnimatePresence>
                        {showPalette && (
                            <>
                                <div className="absolute inset-0 z-30" onClick={() => setShowPalette(false)} />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: -10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: -10 }}
                                    className="absolute top-16 right-4 w-40 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 z-40 shadow-2xl origin-top-right"
                                >
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c.id}
                                                onClick={() => { setSelectedColor(c); setShowPalette(false); }}
                                                className={`w-7 h-7 rounded-full shadow-lg transition-transform ${selectedColor.id === c.id ? 'scale-110 ring-2 ring-white' : 'active:scale-95'}`}
                                                style={{ backgroundColor: c.color }}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-center mt-2 text-[8px] text-neutral-500 font-mono tracking-widest">
                                        PIGMENT
                                    </div>
                                </motion.div>
                            </>
                        )}

                        {/* 画笔粗细选择器面板 */}
                        {showBrushPanel && (
                            <>
                                <div className="absolute inset-0 z-30" onClick={() => setShowBrushPanel(false)} />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0, y: -10 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0.9, opacity: 0, y: -10 }}
                                    className="absolute top-16 right-4 w-48 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 z-40 shadow-2xl origin-top-right"
                                >
                                    <div className="flex items-center justify-around gap-2">
                                        {[1, 2, 3, 4, 5].map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => { setBrushSize(size); setShowBrushPanel(false); }}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${brushSize === size ? 'bg-white/20 ring-2 ring-white scale-110' : 'bg-white/5 active:scale-95'}`}
                                            >
                                                <div
                                                    className="rounded-full bg-white"
                                                    style={{ width: `${4 + size * 4}px`, height: `${4 + size * 4}px` }}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <div className="text-center mt-3 text-[10px] text-neutral-500 font-mono tracking-widest">
                                        BRUSH SIZE
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* 形状提示 */}
                    {currentShape.id !== 'free' && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/20 font-bold text-xl pointer-events-none opacity-20">
                            {currentShape.name}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SandArt;
