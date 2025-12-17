import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Eraser, PaintBucket, Pipette, Trash2, Save, Grid, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

const LS_KEY = 'pixel_canvas_data';

// 调色板主题配置
const PALETTES = {
    retro: {
        name: '复古',
        colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'],
    },
    neon: {
        name: '霓虹',
        colors: ['#000000', '#0D0D0D', '#1A1A2E', '#16213E', '#0F3460', '#E94560', '#533483', '#0EAD69', '#F8B500', '#FF006E', '#00F5D4', '#9B5DE5', '#00BBF9', '#FEE440', '#F15BB5', '#FFFFFF'],
    },
    pastel: {
        name: '柔和',
        colors: ['#FFFFFF', '#FFE5E5', '#E5FFE5', '#E5E5FF', '#FFFFE5', '#FFE5FF', '#E5FFFF', '#FFF0E5', '#FFB3B3', '#B3FFB3', '#B3B3FF', '#FFFFB3', '#FFB3FF', '#B3FFFF', '#FFD9B3', '#D9D9D9'],
    },
};

// 支持的网格大小选项
const GRID_SIZES = [8, 16, 24, 32];

const PixelCanvas = ({ onClose }) => {
    // 状态管理
    const [gridSize, setGridSize] = useState(16);
    const [pixels, setPixels] = useState(() => Array(16 * 16).fill(null));
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [palette, setPalette] = useState('retro');
    const [tool, setTool] = useState('brush'); // brush, eraser, fill, picker
    const [showSettings, setShowSettings] = useState(false);
    const [showSaveToast, setShowSaveToast] = useState(false);

    // 初始化：加载本地存档
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.pixels && data.gridSize) {
                    setGridSize(data.gridSize);
                    setPixels(data.pixels);
                }
            }
        } catch (e) {
            console.warn('读取像素画存档失败:', e);
        }
    }, []);

    // 自动保存机制：当像素数据或网格大小改变时自动保存
    useEffect(() => {
        // 使用防抖或简单的延迟保存避免频繁写入
        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(LS_KEY, JSON.stringify({ pixels, gridSize }));
            } catch (e) {
                console.warn('自动保存失败:', e);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [pixels, gridSize]);

    // 切换网格大小时重置画布
    const handleGridSizeChange = (size) => {
        setGridSize(size);
        setPixels(Array(size * size).fill(null));
        setShowSettings(false);
        playSound('tap.mp3');
    };

    // 洪水填充算法 (Flood Fill) - 用于油漆桶工具
    // 递归地将相连的同色区域替换为新颜色
    const floodFill = useCallback((index, targetColor, newColor) => {
        if (targetColor === newColor) return;

        const newPixels = [...pixels];
        const stack = [index];
        const visited = new Set();
        let changed = false;

        while (stack.length > 0) {
            const i = stack.pop();
            // 越界或已访问检查
            if (visited.has(i)) continue;
            if (i < 0 || i >= pixels.length) continue;
            if (newPixels[i] !== targetColor) continue;

            visited.add(i);
            newPixels[i] = newColor;
            changed = true;

            // 计算坐标以检查相邻格子
            const x = i % gridSize;
            const y = Math.floor(i / gridSize);

            // 将上下左右相邻格子加入栈
            if (x > 0) stack.push(i - 1);
            if (x < gridSize - 1) stack.push(i + 1);
            if (y > 0) stack.push(i - gridSize);
            if (y < gridSize - 1) stack.push(i + gridSize);
        }

        if (changed) {
            setPixels(newPixels);
            playSound('1.mp3'); // 播放填充音效
        }
    }, [pixels, gridSize]);

    // 处理单个像素的点击交互
    const handlePixelClick = (index) => {
        if (tool === 'brush') {
            // 画笔工具：上色
            if (pixels[index] !== selectedColor) {
                const newPixels = [...pixels];
                newPixels[index] = selectedColor;
                setPixels(newPixels);
                // 只有颜色改变时才播音效，避免拖动时噪音过大
                // 这里为了手感，可以在PointerDown时播放
            }
        } else if (tool === 'eraser') {
            // 橡皮擦：清除颜色
            if (pixels[index] !== null) {
                const newPixels = [...pixels];
                newPixels[index] = null;
                setPixels(newPixels);
            }
        } else if (tool === 'fill') {
            // 油漆桶：填充区域
            floodFill(index, pixels[index], selectedColor);
        } else if (tool === 'picker') {
            // 取色器：吸取颜色
            if (pixels[index]) {
                setSelectedColor(pixels[index]);
                setTool('brush'); // 取色后自动切回画笔
                playSound('tap.mp3');
            }
        }
    };

    // 触摸/鼠标拖动绘制逻辑
    const [isDrawing, setIsDrawing] = useState(false);

    const handlePointerDown = (index) => {
        setIsDrawing(true);
        handlePixelClick(index);
        // 按下时播放音效 (仅画笔和橡皮)
        if (tool === 'brush' || tool === 'eraser') {
            playSound('tap.mp3');
        }
    };

    const handlePointerEnter = (index) => {
        // 拖动时持续绘制
        if (isDrawing && (tool === 'brush' || tool === 'eraser')) {
            handlePixelClick(index);
        }
    };

    const handlePointerUp = () => {
        setIsDrawing(false);
    };

    // 手动保存（显示提示）
    const handleSave = () => {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify({ pixels, gridSize }));
            setShowSaveToast(true);
            playSound('1.mp3');
            setTimeout(() => setShowSaveToast(false), 2000);
        } catch (e) {
            console.warn('保存失败:', e);
        }
    };

    // 清空画布
    const handleClear = () => {
        setPixels(Array(gridSize * gridSize).fill(null));
        playSound('1.mp3');
    };

    const currentPalette = PALETTES[palette];
    // 根据网格大小动态计算格子显示尺寸
    const cellSize = Math.floor(280 / gridSize);

    return (
        <div
            className="h-full bg-neutral-900 flex flex-col"
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between p-3 bg-neutral-800">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-lg">
                    <ArrowLeft size={20} className="text-white" />
                </button>

                <div className="flex gap-2">
                    <button onClick={handleClear} className="p-2 bg-white/10 rounded-lg">
                        <Trash2 size={18} className="text-white" />
                    </button>
                    <button onClick={handleSave} className="p-2 bg-white/10 rounded-lg">
                        <Save size={18} className="text-white" />
                    </button>
                    <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-white/10 rounded-lg">
                        <Grid size={18} className="text-white" />
                    </button>
                </div>
            </div>

            {/* 绘图工具选择栏 */}
            <div className="flex items-center justify-center gap-2 p-3 bg-neutral-850">
                {[
                    { id: 'brush', icon: '✏️', label: '画笔' },
                    { id: 'eraser', icon: <Eraser size={18} />, label: '橡皮' },
                    { id: 'fill', icon: <PaintBucket size={18} />, label: '填充' },
                    { id: 'picker', icon: <Pipette size={18} />, label: '取色' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setTool(t.id); playSound('tap.mp3'); }}
                        className={`p-3 rounded-xl transition-all ${tool === t.id ? 'bg-white text-black scale-110' : 'bg-white/10 text-white'
                            }`}
                    >
                        {typeof t.icon === 'string' ? <span className="text-lg">{t.icon}</span> : t.icon}
                    </button>
                ))}

                {/* 当前选颜色预览 */}
                <div
                    className="w-10 h-10 rounded-xl border-2 border-white/50 ml-2 shadow-lg"
                    style={{ backgroundColor: selectedColor }}
                />
            </div>

            {/* 画布区域 */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div
                    className="grid bg-neutral-800 rounded-lg overflow-hidden border border-white/10 shadow-2xl"
                    style={{
                        gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
                        gap: '1px',
                    }}
                >
                    {pixels.map((color, index) => (
                        <div
                            key={index}
                            className="transition-colors cursor-pointer hover:opacity-80"
                            style={{
                                width: cellSize,
                                height: cellSize,
                                backgroundColor: color || '#2a2a2a', // 空格子显示深灰色
                            }}
                            onPointerDown={() => handlePointerDown(index)}
                            onPointerEnter={() => handlePointerEnter(index)}
                        />
                    ))}
                </div>
            </div>

            {/* 底部调色板区域 */}
            <div className="p-3 bg-neutral-800">
                {/* 调色板主题切换 */}
                <div className="flex justify-center gap-2 mb-3">
                    {Object.entries(PALETTES).map(([key, p]) => (
                        <button
                            key={key}
                            onClick={() => { setPalette(key); playSound('tap.mp3'); }}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${palette === key ? 'bg-white text-black' : 'bg-white/10 text-white'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                {/* 具体的颜色网格 */}
                <div className="grid grid-cols-8 gap-1.5 max-w-xs mx-auto">
                    {currentPalette.colors.map((color, i) => (
                        <button
                            key={i}
                            onClick={() => { setSelectedColor(color); setTool('brush'); playSound('tap.mp3'); }}
                            className={`w-8 h-8 rounded-lg transition-transform ${selectedColor === color ? 'scale-110 ring-2 ring-white' : ''
                                }`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            {/* 设置弹窗 (修改网格大小) */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 z-20"
                            onClick={() => setShowSettings(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-800 rounded-2xl p-6 z-30 shadow-2xl border border-white/10"
                        >
                            <h3 className="text-white font-bold mb-4 text-center">画布大小</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {GRID_SIZES.map(size => (
                                    <button
                                        key={size}
                                        onClick={() => handleGridSizeChange(size)}
                                        className={`py-3 px-4 rounded-xl font-bold transition-all ${gridSize === size ? 'bg-white text-black' : 'bg-white/10 text-white'
                                            }`}
                                    >
                                        {size}×{size}
                                    </button>
                                ))}
                            </div>
                            <p className="text-white/50 text-xs text-center mt-4">
                                ⚠️ 更改大小将清空当前画布
                            </p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 保存成功提示 */}
            <AnimatePresence>
                {showSaveToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full text-sm z-50 shadow-lg"
                    >
                        ✓ 作品已保存
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PixelCanvas;
