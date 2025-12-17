import React, { useState } from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

const EmotionFlush = ({ onClose }) => {
    const [text, setText] = useState('');
    const [flushing, setFlushing] = useState(false);
    const [showPaper, setShowPaper] = useState(true); // 控制纸张显示/重置

    const handleFlush = () => {
        if (!text.trim() && !flushing) return;

        setFlushing(true);
        playSound('flush.mp3');
        if (navigator.vibrate) navigator.vibrate([50, 50, 200]);

        // 1. 纸张被冲走 (通过 Animation 实现)
        // 2秒后，重置文字并显示新纸
        setTimeout(() => {
            setText('');
            setShowPaper(false); // 先隐藏旧纸（其实已经飞走了）

            // 短暂延迟后，新纸滑入
            setTimeout(() => {
                setFlushing(false);
                setShowPaper(true);
                playSound('paper_slide.mp3'); // 假设有这个声音，或者 reusing 其他清脆声音
            }, 500);
        }, 2000); // 冲水动画持续时间
    };

    return (
        <div className="h-full bg-slate-100 flex flex-col relative overflow-hidden">
            {/* 顶部返回 */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={onClose} className="p-2 bg-white/80 rounded-full shadow-sm active:scale-95 transition-transform">
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8 relative z-10">

                <h2 className="text-2xl font-bold text-slate-700 font-serif">情绪马桶</h2>
                <p className="text-slate-500 text-sm text-center">把烦恼写下来，然后冲向大海。</p>

                {/* 卷纸容器 */}
                <div className="relative w-full max-w-xs min-h-[300px] perspective-1000">
                    <AnimatePresence mode="wait">
                        {showPaper && !flushing && (
                            <motion.div
                                key="paper-form"
                                initial={{ y: -300, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{
                                    y: 500,
                                    scale: 0.2,
                                    rotate: 720,
                                    opacity: 0,
                                    transition: { duration: 1.5, ease: "anticipate" }
                                }}
                                className="w-full h-full bg-white shadow-xl border-x-2 border-slate-200 relative overflow-hidden origin-bottom"
                            >
                                {/* 撕纸效果边缘 */}
                                <div className="absolute -top-1 w-full h-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMCA0IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiBmaWxsPSIjZjFmMZVmNSI+PHBhdGggZD0iTTAgNGw1LTRsNSA0bDUtNGw1IDRWMHgyMHoiLz48L3N2Zz4=')] bg-repeat-x bg-contain opacity-50" />

                                {/* 纸张纹理 */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,#e5e7eb_24px)] bg-[size:100%_24px] pointer-events-none opacity-50 pt-8" />
                                <div className="absolute left-8 top-0 bottom-0 w-px bg-red-200/50 pointer-events-none" />

                                <textarea
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="在此输入让你不爽的事情..."
                                    className="w-full h-full p-8 pl-12 text-slate-700 resize-none outline-none bg-transparent leading-[24px] font-handwriting text-lg"
                                    style={{ fontFamily: 'cursive', lineHeight: '24px' }}
                                    disabled={flushing}
                                />
                            </motion.div>
                        )}

                        {/* 冲水时的视觉替代品 (Clone) - 用于被冲走的动画 */}
                        {flushing && (
                            <motion.div
                                key="flushing-paper"
                                initial={{ rotate: 0, y: 0 }}
                                animate={{
                                    y: [0, 50, 400],
                                    scale: [1, 0.8, 0],
                                    rotate: [0, -10, 720],
                                    opacity: [1, 1, 0]
                                }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                                className="absolute inset-0 bg-white shadow-xl border-x-2 border-slate-200 p-8 pl-12 overflow-hidden origin-center"
                            >
                                {/* 保持与上面一致的样式，制造“同一张纸”被冲走的错觉 */}
                                <div className="absolute inset-0 bg-[linear-gradient(transparent_23px,#e5e7eb_24px)] bg-[size:100%_24px] pointer-events-none opacity-50 pt-8" />
                                <div className="absolute left-8 top-0 bottom-0 w-px bg-red-200/50 pointer-events-none" />
                                <div className="w-full h-full text-slate-700 font-handwriting text-lg whitespace-pre-wrap" style={{ fontFamily: 'cursive', lineHeight: '24px' }}>
                                    {text}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 冲水按钮 */}
                <button
                    onClick={handleFlush}
                    disabled={flushing || !text.trim()}
                    className={`group relative w-24 h-24 rounded-full border-4 border-slate-300 flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.1),inset_0_-5px_10px_rgba(0,0,0,0.1)] transition-all active:scale-95 ${flushing ? 'bg-blue-100' : 'bg-white hover:border-blue-300'}`}
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-200 rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.1)] flex items-center justify-center group-active:translate-y-1 transition-transform">
                        <span className={`text-xs font-black tracking-widest ${flushing ? 'text-blue-400' : 'text-slate-400'}`}>FLUSH</span>
                    </div>
                </button>
            </div>

            {/* 水流漩涡特效 */}
            <AnimatePresence>
                {flushing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none overflow-hidden"
                    >
                        {/* 漩涡中心 */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                            className="w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg,#ffffff_0deg,#3b82f6_90deg,#ffffff_180deg,#3b82f6_270deg,#ffffff_360deg)] opacity-10 blur-3xl"
                        />
                        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmotionFlush;
