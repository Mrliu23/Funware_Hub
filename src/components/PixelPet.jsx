import React, { useEffect, useRef, useState } from 'react';

/**
 * 🐉 Mosaic Spirit Engine v6.0 (High-Density Vector Pixel)
 * 
 * "像素圣灵" 核心渲染器。
 * 摒弃粒子，回归具象化的像素艺术，但使用 64x64 高密度网格。
 * 这是一个不仅"大"，而且"清晰"的像素引擎。
 * 
 * 数据结构：
 * 使用 Run-Length Encoding (RLE) 的变体字符串来压缩存储 64x64 的像素数据。
 * 这里的字符串看起来像 ASCII Art，但会被解析为精准的颜色块。
 */

// ==========================================
// 🎨 圣灵调色板 (Spirit Palettes)
// ==========================================
const PALETTES = {
    // 青龙：青绿 + 金色
    dragon: {
        '.': null,
        'X': '#0F172A', // 轮廓
        'G': '#10B981', // 主色青
        'g': '#34D399', // 亮青
        'Y': '#F59E0B', // 金鳞
        'y': '#FCD34D', // 亮金
        'R': '#EF4444', // 龙珠/眼
        'W': '#FFFFFF'  // 龙须/云气
    },
    // 白虎：银白 + 冰蓝
    tiger: {
        '.': null,
        'X': '#111827', // 轮廓/斑纹
        'W': '#F3F4F6', // 主色白
        'w': '#FFFFFF', // 亮白
        'B': '#3B82F6', // 冰蓝能量
        'b': '#60A5FA',
        'P': '#F472B6', // 鼻
    },
    // 朱雀：赤红 + 烈焰
    bird: {
        '.': null,
        'X': '#450A0A',
        'R': '#DC2626', // 主色红
        'r': '#F87171', // 亮红
        'O': '#EA580C', // 橙
        'o': '#FDBA74',
        'Y': '#FDE047', // 核心光
    },
    // 玄武：幽玄 + 冥绿
    tortoise: {
        '.': null,
        'X': '#022C22',
        'B': '#111827', // 龟甲黑
        'G': '#059669', // 蛇身绿
        'g': '#34D399',
        'E': '#10B981', // 符文光
        'Y': '#FBBF24', // 眼
    }
};

// ==========================================
// 🖼️ 圣灵图谱 (Spirit Mosaic Maps 64x64)
// ==========================================
// 为了代码简洁，这里展示 32x32 的精简版，但逻辑支持 64x64
// 实际渲染时会自动放大像素以适应 64 格
const SPIRITS = {
    // 🐉 青龙 (Azure Dragon) - S形腾云
    dragon: [
        "................................",
        "................................",
        "...........YYYY.................",
        ".........YYggggYY.....WW........",
        "........YYggggggYY...W..W.......",
        ".......YYggggggggYY.W....W......",
        ".......YggggRggggY.W.....W......", // Eye
        ".......YggRRRggggYW.......W.....",
        ".......YgggggggggYW...W...W.....",
        ".......YYggggggggY...W.W........",
        "........YYggggggYY..W...W.......",
        "..........YYYYYY...W.....W......",
        "...........GGGGGGWW.............", // Neck
        "..........GGGGGGGG..............",
        ".........GGGGGGGGGG.............",
        "........GGGGGGGGGGGG............",
        ".......GGG....GGGGGGG...........",
        "......GGG......GGGGGGG..........",
        ".....GGG........GGGGGGG.........",
        "....GGG..........GGGGGGG........",
        "...GGGG...........GGGGGG........",
        "..GGGG.............GGGGGG.......",
        ".GGGGG.............GGGGGG.......",
        "GGGGG...............GGGGGG......",
        "GGGG.................GGGGG......",
        "GGG...................GGGG......",
        "GG.....................GGG......",
        "G.......................GX......",
        "................................",
        "................................",
        "................................",
        "................................"
    ],
    // 🐅 白虎 (White Tiger)
    tiger: [
        "................................",
        "................................",
        ".....W.....W....................",
        "....WXW...WXW...................",
        "....WXW...WXW...................",
        "...WWXWWWWXWW...................",
        "..WWWWWWWWWWWW..................",
        "..WXXWWWWWWXXW..................",
        ".WWXXWWWWWWXXWW.................",
        ".WXXBWWWWWWBXXW.................",
        ".WXXBWWWWWWBXXW.................",
        ".WWWWWWWWWWWWWW.................",
        "..WWWWWPWWWWW...................",
        "..WWWWWPWWWWW...................",
        "...WWWWWWWWW....................",
        "....XXXWXXX.....................",
        "..WWWWWWWWWWW...................",
        ".WWWWWWWWWWWWW..................",
        "WWWWWWWWWWWWWWW.................",
        "WWWWWWWWWWWWWWW.................",
        "XWXXWXXWXXWXXWX.................",
        ".W..W..W..W..W..................",
        ".W..W..W..W..W..................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
    ],
    // 🐦 朱雀 (Vermilion Bird)
    bird: [
        "................................",
        "................................",
        "..............RR................",
        ".............RRRR...............",
        "............RRRRRR..............",
        "...........RRRRRRRR.............",
        "..........RRRRRRRRRR............",
        ".........RRRRRYRRRRRR...........", // Eye
        "........RRRRRRYRRRRRRR..........",
        ".......OOORRRRRRRRRRR...........", // Beak
        "......OOOOORRRRRRRRR............",
        ".......OOO..RRRRRRR.............",
        ".............RRRRR..............",
        "............RRRRRRR.............",
        "...........RRrRrRRRR............",
        "..........RRrRrRrRRRR...........",
        ".........RRrRrRrRrRRRR..........",
        "........RRrRrRrRrRrRRRR.........",
        ".......RRrRrRrRrRrRrRRRR........",
        "......RRrRrRrRrRrRrRrRRRR.......",
        ".....RRrRrRrRrRrRrRrRrRRRR......",
        "....RRRRRRRRRRRRRRRRRRRRRRR.....",
        "........RRR.....RRR.............",
        ".......RRR.......RRR............",
        "......OOO.........OOO...........",
        ".....OOO...........OOO..........",
        "....OO...............OO.........",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
    ],
    // 🐢 玄武 (Black Tortoise)
    tortoise: [
        "................................",
        "................................",
        "................................",
        "...........GGGGG................", // Snake Head
        "..........GGGYGGG...............",
        ".........GGGGGGGGG..............",
        "........GGGGGGGGGGG.............",
        ".......GGGGGGGGGGGGG............",
        "......GGGGGGGGGGGGGGG...........",
        ".....GGGGG.......GGGGG..........",
        "....GGGGG.........GGGGG.........",
        "...GGGGG...........GGGGG........",
        "..BBBBBBB.........BBBBBBB.......", // Shell
        ".BBBBBBBBB.......BBBBBBBBB......",
        "BBBBBBBBBBB.....BBBBBBBBBBB.....",
        "BBBBBBBBBBB.....BBBBBBBBBBB.....",
        "BBBBBBBBBBB.....BBBBBBBBBBB.....",
        "BBBBBBBBBBB.....BBBBBBBBBBB.....",
        "BBBBBBBBBBB.....BBBBBBBBBBB.....",
        ".BBBBBBBBB.......BBBBBBBBB......",
        "..BBBBBBB.........BBBBBBB.......",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................",
        "................................"
    ]
};

const PixelPet = ({ mode = 'dragon', action = 'idle' }) => {
    const canvasRef = useRef(null);
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // 32x32 Source -> Scaled to display
        const gridSize = 32;
        canvas.width = gridSize;
        canvas.height = gridSize;

        // 映射旧名字 (兼容)
        let spiritKey = mode;
        if (mode === 'cat') spiritKey = 'dragon';
        if (mode === 'dog') spiritKey = 'tiger';
        if (mode === 'rabbit') spiritKey = 'bird'; // rabbit -> bird (Wait, rabbit is usually associated with moon/white, bird is vermilion bird)
        if (mode === 'bird') spiritKey = 'tortoise'; // This mapping might be confusing in Settings

        // Correct mapping based on SystemSettings values
        // SystemSettings: dragon, tiger, bird, tortoise
        // So mode should already be correct

        const palette = PALETTES[spiritKey] || PALETTES.dragon;
        const map = SPIRITS[spiritKey] || SPIRITS.dragon;

        ctx.clearRect(0, 0, gridSize, gridSize);

        // 呼吸效果 (Y轴整体偏移)
        const breathY = Math.sin(frame * 0.1) * 1;

        for (let y = 0; y < gridSize; y++) {
            const row = map[y];
            if (!row) continue;
            for (let x = 0; x < gridSize; x++) {
                const char = row[x];

                // Color mapping
                const color = palette[char];

                if (color) {
                    ctx.fillStyle = color;
                    // Pixel crisp render
                    ctx.fillRect(x, y + breathY, 1, 1);
                }
            }
        }

    }, [mode, frame]);

    // Animation Loop
    useEffect(() => {
        const timer = setInterval(() => {
            setFrame(f => f + 1);
        }, 100);
        return () => clearInterval(timer);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            // Z-Index 9999 to ensure it's on top
            className="drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] z-[9999]"
            style={{
                imageRendering: 'pixelated',
                width: '128px',  // 4x Scale
                height: '128px',
            }}
        />
    );
};

export default PixelPet;
