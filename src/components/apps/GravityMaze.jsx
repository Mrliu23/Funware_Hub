import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Trophy, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

// 游戏常量配置
const CELL_SIZE = 20; // 格子大小
const COLS = 15;      // 列数
const ROWS = 20;      // 行数
const BALL_RADIUS = 8; // 球半径

// 本地存储键名
const LS_KEY_MAZE_PROGRESS = 'gravity_maze_progress';

/**
 * 迷宫生成算法 - 深度优先搜索 (DFS)
 * 1. 初始化全墙壁网格
 * 2. 从起点开始，随机选择方向挖掘
 * 3. 维护一个栈来回溯，确保生成完美迷宫（无环，通过所有可达区域）
 */
const generateMaze = () => {
    // 初始化全是墙 (1: 墙, 0: 路)
    const maze = Array(ROWS).fill(null).map(() => Array(COLS).fill(1));

    const stack = [];
    const startX = 1;
    const startY = 1;

    maze[startY][startX] = 0;
    stack.push([startX, startY]);

    // 上下左右四个方向 (步长为2，保证隔墙)
    const directions = [
        [0, -2], [0, 2], [-2, 0], [2, 0]
    ];

    while (stack.length > 0) {
        const [cx, cy] = stack[stack.length - 1];

        // 随机打乱搜索方向
        const shuffled = directions.sort(() => Math.random() - 0.5);
        let found = false;

        for (const [dx, dy] of shuffled) {
            const nx = cx + dx;
            const ny = cy + dy;

            // 检查边界和是否已访问
            if (nx > 0 && nx < COLS - 1 && ny > 0 && ny < ROWS - 1 && maze[ny][nx] === 1) {
                // 打通中间的墙壁
                maze[cy + dy / 2][cx + dx / 2] = 0;
                maze[ny][nx] = 0; // 标记目标格为路
                stack.push([nx, ny]);
                found = true;
                break;
            }
        }

        // 如果死胡同则回溯
        if (!found) {
            stack.pop();
        }
    }

    // 随机放置星星（3-5个）
    // 确保不放在起点，且不重叠
    const stars = [];
    const starCount = 3 + Math.floor(Math.random() * 3);
    while (stars.length < starCount) {
        const sx = 1 + Math.floor(Math.random() * (COLS - 2));
        const sy = 1 + Math.floor(Math.random() * (ROWS - 2));
        if (maze[sy][sx] === 0 && !(sx === 1 && sy === 1) && !stars.some(s => s.x === sx && s.y === sy)) {
            stars.push({ x: sx, y: sy, collected: false });
        }
    }

    // 设置终点（从右下角向回找第一个空格）
    let endX = COLS - 2;
    let endY = ROWS - 2;
    while (maze[endY][endX] === 1 && endY > 1) {
        endY--;
    }
    while (maze[endY][endX] === 1 && endX > 1) {
        endX--;
    }

    return { maze, stars, end: { x: endX, y: endY } };
};

const GravityMaze = ({ onClose }) => {
    const canvasRef = useRef(null);
    const [gameState, setGameState] = useState('playing'); // playing, won
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);

    // 迷宫数据引用
    const mazeDataRef = useRef(generateMaze());
    const [starsCollected, setStarsCollected] = useState(0);

    // 球的物理属性：位置、速度
    const ballRef = useRef({
        x: CELL_SIZE * 1.5,
        y: CELL_SIZE * 1.5,
        vx: 0,
        vy: 0
    });

    // 重力向量（由设备倾斜控制）
    const gravityRef = useRef({ x: 0, y: 0.5 });

    // 初始化：加载进度
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_KEY_MAZE_PROGRESS);
            if (saved) {
                const data = JSON.parse(saved);
                setLevel(data.level || 1);
                setScore(data.score || 0);
            }
        } catch (e) {
            console.warn('读取存档失败:', e);
        }
    }, []);

    // 保存进度：每当过关更新等级或分数时保存
    useEffect(() => {
        if (level > 1 || score > 0) {
            localStorage.setItem(LS_KEY_MAZE_PROGRESS, JSON.stringify({ level, score }));
        }
    }, [level, score]);

    // 监听设备方向 (Gravity Sensor)
    useEffect(() => {
        const handleOrientation = (event) => {
            const gamma = event.gamma || 0; // 左右倾斜 -90 to 90
            const beta = event.beta || 0;   // 前后倾斜 -180 to 180

            // 将倾斜角度映射为重力加速度向量
            // 灵敏度调整：除以30让控制更平滑
            gravityRef.current = {
                x: Math.max(-1, Math.min(1, gamma / 30)),
                y: Math.max(-1, Math.min(1, beta / 30))
            };
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    // 碰撞检测逻辑
    // 检查小球包围盒的四个角是否进入墙壁格子
    const checkCollision = useCallback((x, y) => {
        const { maze } = mazeDataRef.current;

        const corners = [
            { x: x - BALL_RADIUS + 2, y: y - BALL_RADIUS + 2 },
            { x: x + BALL_RADIUS - 2, y: y - BALL_RADIUS + 2 },
            { x: x - BALL_RADIUS + 2, y: y + BALL_RADIUS - 2 },
            { x: x + BALL_RADIUS - 2, y: y + BALL_RADIUS - 2 },
        ];

        for (const corner of corners) {
            const cellX = Math.floor(corner.x / CELL_SIZE);
            const cellY = Math.floor(corner.y / CELL_SIZE);

            // 检查边界
            if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) {
                return true;
            }
            // 检查墙壁 (1为墙)
            if (maze[cellY] && maze[cellY][cellX] === 1) {
                return true;
            }
        }
        return false;
    }, []);

    // 游戏主循环 (Game Loop)
    useEffect(() => {
        if (gameState !== 'playing') return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let animationId;

        const update = () => {
            const ball = ballRef.current;
            const { stars, end } = mazeDataRef.current;
            const gravity = gravityRef.current;

            // 1. 物理更新
            // 应用重力
            ball.vx += gravity.x * 0.3;
            ball.vy += gravity.y * 0.3;

            // 应用摩擦力 (空气阻力)
            ball.vx *= 0.95;
            ball.vy *= 0.95;

            // 速度限制 (终端速度)
            const maxSpeed = 5;
            ball.vx = Math.max(-maxSpeed, Math.min(maxSpeed, ball.vx));
            ball.vy = Math.max(-maxSpeed, Math.min(maxSpeed, ball.vy));

            // 2. 位置更新与碰撞响应
            // X轴移动
            const newX = ball.x + ball.vx;
            if (!checkCollision(newX, ball.y)) {
                ball.x = newX;
            } else {
                // 撞墙反弹
                if (Math.abs(ball.vx) > 1) playSound('1.mp3'); // 只有速度够快才播放音效
                ball.vx = -ball.vx * 0.4; // 较小的反弹系数
            }

            // Y轴移动
            const newY = ball.y + ball.vy;
            if (!checkCollision(ball.x, newY)) {
                ball.y = newY;
            } else {
                // 撞墙反弹
                if (Math.abs(ball.vy) > 1) playSound('1.mp3');
                ball.vy = -ball.vy * 0.4;
            }

            // 简单的边界钳制
            ball.x = Math.max(BALL_RADIUS, Math.min(COLS * CELL_SIZE - BALL_RADIUS, ball.x));
            ball.y = Math.max(BALL_RADIUS, Math.min(ROWS * CELL_SIZE - BALL_RADIUS, ball.y));

            // 3. 游戏逻辑
            // 收集星星检测
            stars.forEach((star) => {
                if (!star.collected) {
                    const dx = ball.x - (star.x * CELL_SIZE + CELL_SIZE / 2);
                    const dy = ball.y - (star.y * CELL_SIZE + CELL_SIZE / 2);
                    if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS + 8) {
                        star.collected = true;
                        setStarsCollected(prev => prev + 1);
                        setScore(prev => prev + 100);
                        playSound('1.mp3'); // 收集音效
                    }
                }
            });

            // 到达终点检测
            const endCenterX = end.x * CELL_SIZE + CELL_SIZE / 2;
            const endCenterY = end.y * CELL_SIZE + CELL_SIZE / 2;
            const dx = ball.x - endCenterX;
            const dy = ball.y - endCenterY;
            if (Math.sqrt(dx * dx + dy * dy) < BALL_RADIUS + 5) {
                setGameState('won');
                setScore(prev => prev + level * 200); // 过关奖励分
                playSound('1.mp3'); // 胜利音效
                return;
            }

            // 4. 渲染画面
            render(ctx, ball, stars, end);

            animationId = requestAnimationFrame(update);
        };

        update();
        return () => cancelAnimationFrame(animationId);
    }, [gameState, checkCollision, level]);

    // 渲染每一帧
    const render = (ctx, ball, stars, end) => {
        const { maze } = mazeDataRef.current;
        const width = COLS * CELL_SIZE;
        const height = ROWS * CELL_SIZE;

        // 清空背景
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, width, height);

        // 绘制迷宫墙壁
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (maze[y][x] === 1) {
                    ctx.fillStyle = '#4a4e69';
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                    // 简单的光影效果
                    ctx.fillStyle = '#565b7a';
                    ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, 2);
                }
            }
        }

        // 绘制终点 (绿色光晕圈)
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(end.x * CELL_SIZE + CELL_SIZE / 2, end.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2.5, 0, Math.PI * 2);
        ctx.fill();
        // 终点光晕
        ctx.strokeStyle = `rgba(34, 197, 94, ${0.5 + Math.sin(Date.now() / 200) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 绘制星星
        ctx.fillStyle = '#fbbf24';
        stars.forEach(star => {
            if (!star.collected) {
                const cx = star.x * CELL_SIZE + CELL_SIZE / 2;
                const cy = star.y * CELL_SIZE + CELL_SIZE / 2;
                const outerR = 7;
                const innerR = 3;
                // 复用之前的完美五角星绘制逻辑
                ctx.beginPath();
                for (let i = 0; i < 10; i++) {
                    const angle = (i * Math.PI / 5) - Math.PI / 2;
                    const r = i % 2 === 0 ? outerR : innerR;
                    const px = cx + Math.cos(angle) * r;
                    const py = cy + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
            }
        });

        // 绘制小球
        const gradient = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 0, ball.x, ball.y, BALL_RADIUS);
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#2563eb');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // 球的高光
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(ball.x - 2, ball.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        // 阴影
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowColor = 'transparent';
    };

    // 重新开始当前关卡
    const handleRestart = () => {
        mazeDataRef.current = generateMaze();
        ballRef.current = { x: CELL_SIZE * 1.5, y: CELL_SIZE * 1.5, vx: 0, vy: 0 };
        setStarsCollected(0);
        setGameState('playing');
        playSound('1.mp3');
    };

    // 晋级下一关
    const handleNextLevel = () => {
        setLevel(prev => prev + 1);
        handleRestart(); // 生成新迷宫
        playSound('1.mp3');
    };

    return (
        <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
            {/* 顶部UI栏 */}
            <div className="flex items-center justify-between pt-10 pb-4 px-4">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
                    <ArrowLeft size={24} className="text-white" />
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-amber-400">
                        <Star size={18} fill="currentColor" />
                        <span className="font-bold">{starsCollected}</span>
                    </div>
                    <div className="text-white font-mono">
                        Lv.{level} | {score}分
                    </div>
                </div>
                <button onClick={handleRestart} className="p-2 bg-white/10 rounded-full">
                    <RefreshCw size={24} className="text-white" />
                </button>
            </div>

            {/* 游戏主区域 */}
            <div className="flex-1 flex items-center justify-center p-4">
                <canvas
                    ref={canvasRef}
                    width={COLS * CELL_SIZE}
                    height={ROWS * CELL_SIZE}
                    className="rounded-xl border-2 border-white/20 shadow-2xl"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
            </div>

            {/* 操作提示 */}
            <div className="text-center text-white/50 text-xs pb-4">
                倾斜手机控制小球 | 收集星星到达绿点
            </div>

            {/* 胜利结算弹窗 */}
            <AnimatePresence>
                {gameState === 'won' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="bg-slate-800 p-8 rounded-3xl text-center border border-amber-500/50"
                        >
                            <Trophy size={64} className="text-amber-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">关卡完成!</h2>
                            <p className="text-amber-400 text-lg mb-1">收集星星: {starsCollected}</p>
                            <p className="text-white/70 mb-6">总分: {score}</p>
                            <button
                                onClick={handleNextLevel}
                                className="w-full py-3 bg-amber-500 text-black font-bold rounded-xl active:scale-95 transition-transform"
                            >
                                下一关
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GravityMaze;
