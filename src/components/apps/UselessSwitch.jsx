import React, { useState, useEffect, useRef } from 'react';
import { Power, ArrowLeft, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

// 故障/冒烟粒子组件
const SmokeParticle = ({ delay, xOffset }) => (
    <motion.div
        initial={{ opacity: 0, y: 0, x: xOffset, scale: 0.2 }}
        animate={{
            opacity: [0, 0.6, 0],
            y: -100,
            x: [xOffset, xOffset + (Math.random() * 40 - 20)],
            scale: [0.2, 1, 1.5]
        }}
        transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: delay,
            ease: "easeOut"
        }}
        className="absolute bottom-1/2 left-1/2 w-3 h-3 rounded-full bg-gray-600 blur-sm pointer-events-none z-30"
    />
);

// 赛博朋克机械臂组件
const MechanicalArm = ({ animate, onHit, onComplete }) => {
    return (
        <motion.div
            initial={{ y: -300 }}
            animate={animate ? "extend" : "retract"}
            variants={{
                extend: {
                    y: [-300, 20, -10, 0], // 更猛烈的冲击：冲过头(砸下去) -> 弹起 -> 压实
                    transition: { duration: 0.15, times: [0, 0.6, 0.8, 1] } // 极速：0.15秒完成
                },
                retract: {
                    y: -300,
                    transition: { duration: 0.2, ease: 'easeIn' }
                }
            }}
            onAnimationComplete={(definition) => {
                if (definition === 'extend') {
                    onHit();
                    setTimeout(onComplete, 100); // 极短停留后缩回
                }
            }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-64 pointer-events-none z-30 flex flex-col items-center"
        >
            {/* 主液压杆 (Deep Metal) */}
            <div className="w-10 h-full bg-slate-800 border-x-2 border-slate-600 relative overflow-hidden shadow-2xl">
                {/* 内部发光核心 (Neon Core) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-full bg-cyan-900/50 blur-[2px]">
                    <div className="w-full h-full bg-cyan-400/20 animate-pulse" />
                </div>
                {/* 机械细节：警示条纹 */}
                <div className="absolute bottom-10 -left-2 w-16 h-4 bg-yellow-500/80 -rotate-45" />
                <div className="absolute bottom-16 -left-2 w-16 h-4 bg-yellow-500/80 -rotate-45" />

                {/* 铆钉 */}
                <div className="absolute top-4 left-1 w-2 h-2 rounded-full bg-slate-400 shadow-inner" />
                <div className="absolute top-4 right-1 w-2 h-2 rounded-full bg-slate-400 shadow-inner" />
            </div>

            {/* 连接关节 */}
            <div className="w-14 h-6 bg-slate-700 border-2 border-slate-500 rounded-sm z-10 shadow-lg relative flex items-center justify-center">
                <div className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#06b6d4] animate-pulse" />
            </div>

            {/* 机械触手/压板 */}
            <div className="w-12 h-14 bg-gradient-to-b from-slate-700 to-slate-900 rounded-b-lg border-2 border-slate-500 shadow-xl relative flex items-end justify-center pb-2">
                {/* 底部接触面 */}
                <div className="w-8 h-2 bg-cyan-900/50 rounded-full blur-[1px]" />

                {/* 侧面细节 */}
                <div className="absolute top-2 left-[-4px] w-1 h-8 bg-slate-500 rounded-l-md" />
                <div className="absolute top-2 right-[-4px] w-1 h-8 bg-slate-500 rounded-r-md" />
            </div>

            {/* 运动时的拖尾光效 (仅装饰) */}
            <div className="absolute bottom-0 w-full h-4 bg-cyan-500/10 blur-md rounded-full" />
        </motion.div>
    );
};

const UselessSwitch = ({ onClose }) => {
    const [isOn, setIsOn] = useState(false);
    const [angerLevel, setAngerLevel] = useState(0);
    const [message, setMessage] = useState('');
    const [armState, setArmState] = useState('idle');

    // 调整过热阈值到 12 (约10-15次点击)
    const OVERHEAT_THRESHOLD = 12;
    const isOverheated = angerLevel >= OVERHEAT_THRESHOLD;

    const toggleSwitch = () => {
        if (isOn) return; // 已经是开的状态，忽略

        setIsOn(true);
        // 怒气上限提高到 18
        const newAnger = Math.min(angerLevel + 1, 18);
        setAngerLevel(newAnger);

        playSound('switch_click.mp3');

        // 不同状态的处理逻辑
        if (newAnger >= OVERHEAT_THRESHOLD) {
            // === 过热模式 (Overheat Mode) ===
            playSound('angry_buzz.mp3');
            if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

            updateMessage(newAnger);

            // 自动回弹 (稍慢一点，因为过热了)
            setTimeout(() => {
                setIsOn(false);
                playSound('switch_click.mp3');
            }, 300);

        } else {
            // === 正常模式 (Normal Mode) ===
            // 反应极快：怒气越高，反应越快，最快 50ms
            const delay = Math.max(50, 500 - newAnger * 60);
            updateMessage(newAnger);

            // 召唤机械臂
            setTimeout(() => {
                setArmState('extending');
                // 高怒气时加一点电流音
                if (newAnger > 5) playSound('angry_buzz.mp3');
            }, delay);
        }
    };

    const updateMessage = (level) => {
        if (level > 4 && level < OVERHEAT_THRESHOLD) {
            setMessage("别碰我！");
        } else if (level >= OVERHEAT_THRESHOLD && level < 15) {
            setMessage("系统故障！(System Error)");
        } else if (level >= 15) {
            setMessage("严重过热警告！(CRITICAL)");
        } else {
            setMessage("");
        }
    };

    const handleArmHit = () => {
        setIsOn(false);
        playSound('switch_click.mp3');
        // 更强的撞击震动
        if (navigator.vibrate) navigator.vibrate(80);
    };

    const handleArmComplete = () => {
        setArmState('retracting');
        setTimeout(() => setArmState('idle'), 200);
    };

    // 冷却逻辑：稍微变慢，让红温状态持久一点
    useEffect(() => {
        const interval = setInterval(() => {
            setAngerLevel(prev => Math.max(0, prev - 1));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`h-full flex flex-col relative transition-colors duration-500 ${isOverheated ? 'bg-red-950' : 'bg-slate-200'} text-gray-800 overflow-hidden`}>

            {/* 只有在非过热状态下，才显示机械臂 */}
            {!isOverheated && (
                <MechanicalArm
                    animate={armState === 'extending'}
                    onHit={handleArmHit}
                    onComplete={handleArmComplete}
                />
            )}

            {/* 顶部返回 */}
            <div className="absolute top-4 left-4 z-10">
                <button onClick={onClose} className="p-2 bg-white/50 rounded-full shadow-sm">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-12 relative">

                {/* 状态消息 */}
                <div className="h-12 flex items-center justify-center z-10 w-full">
                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                key={message}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
                                className={`px-6 py-2 rounded-sm font-mono font-bold flex items-center gap-2 border-l-4 ${isOverheated ? 'bg-black/80 text-red-500 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-slate-800 text-cyan-400 border-cyan-400'}`}
                            >
                                {isOverheated ? <AlertTriangle size={18} /> : <Zap size={18} />}
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 开关主体 */}
                <div className="relative z-10">
                    {/* 冒烟效果 */}
                    {isOverheated && (
                        <>
                            <SmokeParticle delay={0} xOffset={-20} />
                            <SmokeParticle delay={0.5} xOffset={20} />
                            <SmokeParticle delay={0.2} xOffset={0} />
                            <SmokeParticle delay={0.8} xOffset={-10} />
                        </>
                    )}

                    <div className={`w-48 h-80 rounded-sm shadow-[inset_0_10px_20px_rgba(0,0,0,0.5),0_5px_15px_rgba(0,0,0,0.3)] p-4 flex items-center justify-center border-4 transition-colors duration-200 ${isOverheated ? 'bg-red-900/50 border-red-600' : 'bg-slate-700 border-slate-600'}`}>
                        {/* 装饰性背景面板线 */}
                        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)] pointer-events-none" />

                        <motion.button
                            onClick={toggleSwitch}
                            disabled={armState !== 'idle' && !isOverheated}
                            animate={{
                                y: isOn ? -40 : 40,
                                backgroundColor: isOn ? '#10b981' : '#ef4444',
                                boxShadow: isOn ? '0 0 20px #10b981' : '0 0 10px #ef4444' // Neon Glow
                            }}
                            className="w-full h-32 rounded-sm shadow-xl border-t border-white/20 flex items-center justify-center relative overflow-hidden z-10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/40 pointer-events-none" />
                            <Power size={36} className={`text-white drop-shadow-md mix-blend-overlay ${isOverheated ? 'animate-spin' : ''}`} />

                            {/* Tech Stripes */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-1 bg-black/30" />
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-16 h-1 bg-black/30" />
                        </motion.button>
                    </div>

                    {/* 工业螺丝 */}
                    <div className="absolute top-3 left-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-500 flex items-center justify-center shadow-lg"><div className="w-2 h-0.5 bg-slate-600 rotate-45" /></div>
                    <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-500 flex items-center justify-center shadow-lg"><div className="w-2 h-0.5 bg-slate-600 rotate-12" /></div>
                    <div className="absolute bottom-3 left-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-500 flex items-center justify-center shadow-lg"><div className="w-2 h-0.5 bg-slate-600 rotate-90" /></div>
                    <div className="absolute bottom-3 right-3 w-4 h-4 rounded-full bg-slate-800 border border-slate-500 flex items-center justify-center shadow-lg"><div className="w-2 h-0.5 bg-slate-600 -rotate-45" /></div>
                </div>

                <div className="text-center z-10 select-none">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-800 dark:text-slate-400 opacity-20">CYBER-BOX</h2>
                    <p className="text-[10px] tracking-[0.5em] opacity-40 mt-1">PROTOTYPE-X</p>
                </div>
            </div>

            {/* 故障红光遮罩 */}
            {isOverheated && (
                <div className="absolute inset-0 bg-red-500/20 pointer-events-none z-0 animate-pulse mix-blend-hard-light" />
            )}
        </div>
    );
};

export default UselessSwitch;
