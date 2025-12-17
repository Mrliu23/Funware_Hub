import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

// 签文库
const FORTUNES = [
    { type: "大吉", color: "text-red-500", text: "今日宜摸鱼", desc: "老板不在，带薪拉屎。", num: 1 },
    { type: "中吉", color: "text-orange-500", text: "需求不变更", desc: "不仅不变更，还砍了一个功能。", num: 2 },
    { type: "小吉", color: "text-yellow-500", text: "咖啡半价", desc: "瑞幸发券了，快冲。", num: 3 },
    { type: "下下签", color: "text-gray-500", text: "Bug无法复现", desc: "但在演示时一定会复现。", num: 4 },
    { type: "上上签", color: "text-purple-500", text: "准时下班", desc: "这在互联网行业是奇迹。", num: 5 },
    { type: "凶", color: "text-stone-500", text: "背锅", desc: "不管是谁的错，反正最后是你改。", num: 6 },
    { type: "吉", color: "text-pink-500", text: "外卖好吃", desc: "盲点了一家，居然没踩雷。", num: 7 },
    { type: "平", color: "text-blue-500", text: "无事发生", desc: "没有消息就是好消息。", num: 8 },
    { type: "桃花", color: "text-rose-500", text: "对象在路上", desc: "可能堵车了，再等等。", num: 9 },
    { type: "财运", color: "text-amber-500", text: "股票回本", desc: "指回到了两年前的本。", num: 10 }
];

const CyberDivination = ({ onClose }) => {
    const [gameState, setGameState] = useState('IDLE'); // IDLE, SHAKING, THINKING, RESULT
    const [result, setResult] = useState(null);
    const shakeCount = useRef(0);
    const lastUpdate = useRef(0);
    const shakeTimeout = useRef(null);

    // 摇晃检测
    useEffect(() => {
        const handleMotion = (event) => {
            // 实体机逻辑 (暂略，主要依赖点击模拟)
        };
        // window.addEventListener('devicemotion', handleMotion);
        // return () => window.removeEventListener('devicemotion', handleMotion);
    }, []);

    // 触发摇晃
    const handleInteraction = () => {
        if (gameState === 'RESULT' || gameState === 'THINKING') return;

        // 清除之前的停止计时器
        if (shakeTimeout.current) clearTimeout(shakeTimeout.current);

        if (gameState !== 'SHAKING') {
            setGameState('SHAKING');
            playSound('shake_sticks.mp3');
        }

        shakeCount.current += 1;

        if (navigator.vibrate) navigator.vibrate(50);

        // 如果摇够了，开始出签
        if (shakeCount.current > 6) {
            startDivination();
        } else {
            // 如果停下不摇了，1秒后回到IDLE
            shakeTimeout.current = setTimeout(() => {
                if (shakeCount.current <= 6) {
                    setGameState('IDLE');
                }
            }, 1000);
        }
    };

    const startDivination = () => {
        setGameState('THINKING');
        shakeCount.current = 0;
        playSound('computing.mp3'); // 假设计算音效，如果没有就用其他的

        // 模拟计算过程
        setTimeout(() => {
            const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
            setResult(randomFortune);
            setGameState('RESULT');
            playSound('stick_fall.mp3');
            if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
        }, 2000);
    };

    const reset = () => {
        setResult(null);
        setGameState('IDLE');
        shakeCount.current = 0;
    };

    return (
        <div
            className="h-full bg-slate-950 text-cyan-50 flex flex-col relative overflow-hidden"
            onClick={handleInteraction}
        >
            {/* 动态背景网格 */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#083344_1px,transparent_1px),linear-gradient(to_bottom,#083344_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-20 pointer-events-none" />

            {/* 顶部返回 */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 bg-slate-900/80 backdrop-blur rounded-full border border-cyan-900 text-cyan-400">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative p-8 z-10">

                {/* 状态展示：空闲/摇晃 */}
                <AnimatePresence mode="wait">
                    {(gameState === 'IDLE' || gameState === 'SHAKING') && (
                        <motion.div
                            key="container"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            {/* 签筒动画 */}
                            <motion.div
                                animate={gameState === 'SHAKING' ? {
                                    rotate: [-5, 5, -5, 5, 0],
                                    y: [0, -10, 0, -10, 0],
                                    filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                                } : {}}
                                transition={{ duration: 0.2, repeat: gameState === 'SHAKING' ? Infinity : 0 }}
                                className="w-40 h-64 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-cyan-500/50 relative flex justify-center overflow-visible shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                            >
                                {/* 全息文字 */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-bold text-cyan-900/30 writing-vertical-rl select-none">
                                    CYBER
                                </div>
                                <div className="absolute bottom-4 text-cyan-400 font-mono text-xs tracking-widest">DIVINATION</div>

                                {/* 突出的签 */}
                                <div className="absolute -top-8 flex gap-2">
                                    <div className="w-3 h-24 bg-cyan-900/80 rounded-t-lg border border-cyan-500/30" />
                                    <div className="w-3 h-28 bg-cyan-800/80 rounded-t-lg border border-cyan-500/30 translate-y-2" />
                                    <div className="w-3 h-24 bg-cyan-900/80 rounded-t-lg border border-cyan-500/30" />
                                </div>
                            </motion.div>

                            <p className="mt-12 text-cyan-400/60 font-mono text-sm animate-pulse">
                                {gameState === 'SHAKING' ? "DETECTING MOTION..." : "TAP SCREEN TO SHAKE"}
                            </p>
                        </motion.div>
                    )}

                    {/* 思考中 */}
                    {gameState === 'THINKING' && (
                        <motion.div
                            key="thinking"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
                            className="flex flex-col items-center justify-center"
                        >
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-4 border-t-cyan-500 border-r-transparent border-b-cyan-500 border-l-transparent opacity-80"
                                />
                                <motion.div
                                    animate={{ rotate: -180 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent opacity-60"
                                />
                                <Zap className="text-cyan-400 animate-pulse" size={40} />
                            </div>
                            <p className="mt-8 font-mono text-cyan-400 animate-pulse tracking-widest">COMPUTING KARMA...</p>
                        </motion.div>
                    )}

                    {/* 结果展示 */}
                    {gameState === 'RESULT' && result && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 50, rotateX: 90 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="w-full max-w-sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-1 shadow-[0_0_50px_rgba(6,182,212,0.15)] relative overflow-hidden group">
                                {/* 扫描线特效 */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent h-full w-full translate-y-[-100%] animate-[scan_3s_ease-in-out_infinite]" />

                                <div className="bg-slate-950/50 rounded-[1.2rem] p-8 flex flex-col items-center text-center relative z-10 h-full border border-white/5">

                                    {/* 标签 */}
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="font-mono text-[10px] text-slate-500">NO.{String(result.num).padStart(3, '0')}</div>
                                    </div>

                                    {/* 签文类型 */}
                                    <motion.div
                                        initial={{ scale: 2, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                        className={`text-6xl font-black mb-6 ${result.color} drop-shadow-lg font-serif`}
                                    >
                                        {result.type}
                                    </motion.div>

                                    {/* 内容 */}
                                    <h3 className="text-2xl font-bold text-white mb-2">{result.text}</h3>
                                    <div className="w-12 h-1 bg-cyan-900/50 rounded-full my-4" />
                                    <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                        {result.desc}
                                    </p>

                                    {/* 操作按钮 */}
                                    <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                                        <button
                                            onClick={reset}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-cyan-400 font-bold text-sm active:scale-95 transition-all hover:bg-slate-700"
                                        >
                                            <RefreshCw size={16} />
                                            再求一签
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                                            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600/20 border border-cyan-500/50 text-cyan-100 font-bold text-sm active:scale-95 transition-all hover:bg-cyan-600/30"
                                        >
                                            <Sparkles size={16} />
                                            接受指引
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
            `}</style>
        </div>
    );
};

export default CyberDivination;
