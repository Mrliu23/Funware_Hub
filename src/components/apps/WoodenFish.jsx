import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { playSound } from '../../utils/audio';

// 随机幽默文案库
const TAP_MESSAGES = [
    "功德 +1", "功德 +1", "功德 +1", // 增加普通提示的权重
    "佛祖：收到",
    "心诚则灵",
    "手不酸吗？",
    "今日宜：摸鱼",
    "扣1佛祖陪你",
    "施主请自重",
    "再敲要收费了",
    "电子真经加载中...",
    "烦恼 -1",
    "工资 +0",
    "头发 -1"
];

// 重置时的嘲讽文案
const RESET_TAUNTS = [
    "辛辛苦苦攒的功德，真的要清零吗？",
    "佛祖看着你呢，确定要重开？",
    "一键归零，从头做人？",
    "施主，功德清零容易，再积难啊。",
    "你确信你的业障已经消除了吗？",
    "警告：清零后无法恢复（真的）"
];

const WoodenFish = ({ onClose }) => {
    // 持久化状态初始化
    const [count, setCount] = useState(() => {
        try {
            const saved = localStorage.getItem('wooden_fish_count');
            return saved ? parseInt(saved, 10) : 0;
        } catch (e) {
            return 0;
        }
    });

    const [merits, setMerits] = useState([]);
    const [message, setMessage] = useState(null);

    // 监听 count 变化并保存
    useEffect(() => {
        localStorage.setItem('wooden_fish_count', count.toString());
    }, [count]);

    const handleClick = () => {
        const newCount = count + 1;
        setCount(newCount);
        playSound('wooden_fish.mp3');

        // 随机触发骚话 (20% 概率)
        if (Math.random() < 0.2) {
            const randomMsg = TAP_MESSAGES[Math.floor(Math.random() * TAP_MESSAGES.length)];
            setMessage(randomMsg);
            setTimeout(() => setMessage(null), 2000);
        }

        // 浮动文字效果
        const id = Date.now();
        setMerits(prev => [...prev, { id, x: Math.random() * 60 - 30, y: 0 }]); // 增加一点水平随机范围

        // 动画结束后移除
        setTimeout(() => {
            setMerits(prev => prev.filter(m => m.id !== id));
        }, 1000);
    };

    const [showResetDialog, setShowResetDialog] = useState(false);
    const [currentTaunt, setCurrentTaunt] = useState('');

    const handleResetClick = () => {
        // 随机选一句嘲讽
        setCurrentTaunt(RESET_TAUNTS[Math.floor(Math.random() * RESET_TAUNTS.length)]);
        setShowResetDialog(true);
    };

    const confirmReset = () => {
        setCount(0);
        setShowResetDialog(false);
        setMessage("功德已清空，施主好自为之");
        setTimeout(() => setMessage(null), 3000);
        if (navigator.vibrate) navigator.vibrate([200, 100, 500]); // 震动一下表示遗憾
    };

    return (
        <div className="h-full flex flex-col bg-stone-900 text-amber-50 relative overflow-hidden">
            {/* 返回按钮 */}
            <div className="absolute top-10 left-4 z-10">
                <button onClick={onClose} className="p-2 bg-stone-800 rounded-full shadow-sm text-white active:scale-90 transition-transform">
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 重置按钮 (右上角) */}
            <div className="absolute top-10 right-4 z-10">
                <button
                    onClick={handleResetClick}
                    className="p-2 bg-stone-800 rounded-full shadow-sm text-stone-400 hover:text-red-400 active:scale-90 transition-transform"
                >
                    <RotateCcw size={20} />
                </button>
            </div>

            {/* 自定义重置确认弹窗 */}
            <AnimatePresence>
                {showResetDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-stone-800 border-2 border-amber-800/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-stone-700">
                                <span className="text-3xl">🤔</span>
                            </div>

                            <h3 className="text-xl font-bold font-serif text-amber-500 mb-2">功德清零？</h3>

                            <p className="text-stone-300 mb-8 min-h-[3rem] text-sm leading-relaxed">
                                {currentTaunt}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowResetDialog(false)}
                                    className="flex-1 py-3 bg-stone-700 text-stone-300 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                                >
                                    再敲一会
                                </button>
                                <button
                                    onClick={confirmReset}
                                    className="flex-1 py-3 bg-red-900/80 text-red-200 border border-red-800 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                                >
                                    心如死灰
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 消息提示框 */}
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute top-32 left-0 right-0 z-20 flex justify-center pointer-events-none px-8 text-center"
                    >
                        <div className="bg-amber-100/90 text-amber-900 px-6 py-2 rounded-xl font-bold shadow-lg border-2 border-amber-300 backdrop-blur-sm">
                            {message}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col items-center justify-center gap-12">
                {/* 计数器 */}
                <div className="flex flex-col items-center">
                    <span className="text-stone-500 text-xs tracking-[0.5em] uppercase mb-2">当前功德</span>
                    <span className="text-7xl font-serif font-bold text-amber-500 drop-shadow-lg tabular-nums">
                        {count.toLocaleString()}
                    </span>
                </div>

                {/* 木鱼主体 */}
                <div className="relative">
                    <motion.button
                        whileTap={{ scale: 0.95, rotate: 1 }}
                        onClick={handleClick}
                        className="w-64 h-52 bg-gradient-to-b from-amber-700 to-amber-800 rounded-[40%_60%_60%_40%_/_40%_40%_60%_60%] shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_2px_10px_rgba(255,255,255,0.1)] border-b-8 border-amber-950 flex items-center justify-center relative overflow-hidden group cursor-pointer"
                    >
                        {/* 木纹/细节 */}
                        <div className="absolute right-10 top-14 w-8 h-8 bg-black/40 rounded-full border-2 border-amber-900/50 opacity-60 blur-[1px]" />
                        <div className="absolute left-10 top-1/2 w-32 h-2 bg-black/20 rounded-full blur-[2px]" />

                        {/* 高光 */}
                        <div className="absolute top-6 left-12 w-24 h-12 bg-white/5 rounded-full blur-xl transform -rotate-12" />
                    </motion.button>

                    {/* 功德 +1 浮动动画 */}
                    <AnimatePresence>
                        {merits.map(merit => (
                            <motion.div
                                key={merit.id}
                                initial={{ opacity: 0, y: 0, x: merit.x, scale: 0.5 }}
                                animate={{ opacity: 1, y: -100, scale: 1 }}
                                exit={{ opacity: 0, y: -150 }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="absolute top-0 left-1/2 text-2xl font-bold text-amber-200 pointer-events-none whitespace-nowrap drop-shadow-md font-serif"
                                style={{ transform: 'translateX(-50%)' }}
                            >
                                功德 +1
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                <div className="text-center opacity-40">
                    <p className="text-xs mb-1">点 击 积 累 功 德</p>
                    <p className="text-[10px] uppercase font-mono">Persistence Mode: ON</p>
                </div>
            </div>
        </div>
    );
};

export default WoodenFish;
