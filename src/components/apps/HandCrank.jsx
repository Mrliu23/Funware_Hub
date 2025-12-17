import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { playSound, LoopSound } from '../../utils/audio';

const HandCrank = ({ onClose }) => {
    const [charge, setCharge] = useState(0);
    const [rpm, setRpm] = useState(0);
    const lastAngle = useRef(0);
    const crankRef = useRef(null);
    const soundRef = useRef(null);
    const lastInteraction = useRef(Date.now());

    // 初始化音频
    useEffect(() => {
        soundRef.current = new LoopSound('crank.mp3');
        return () => soundRef.current.stop();
    }, []);

    // 自动掉电逻辑 (恶意满满)
    useEffect(() => {
        const interval = setInterval(() => {
            // 如果最近0.5秒没动，就开始疯狂掉电
            if (Date.now() - lastInteraction.current > 500) {
                setCharge(prev => Math.max(0, prev - 1)); // 每100ms掉1%，非常快
                setRpm(prev => Math.max(0, prev * 0.9)); // 转速衰减
                if (soundRef.current) soundRef.current.stop();
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    // 旋转逻辑 (这里简化为拖拽或者点击，为了方便手机操作，我们用 Pan Gesture 模拟摇把)
    // 更好的方式：检测以中心为圆心的角度变化

    const handlePan = (event, info) => {
        // 更新交互时间
        lastInteraction.current = Date.now();
        playCrankSound();

        // 简单增加电量，只要在动
        const speed = Math.abs(info.velocity.x) + Math.abs(info.velocity.y);

        // 增加转速视觉
        setRpm(Math.min(speed / 100, 1000));

        // 电量增加：调低倍率，增加难度
        // 速度越快加得越多，但有上限
        const gain = Math.min(speed / 2000, 0.01); // 大幅降低：从 0.5 降到 0.05，降低10倍
        setCharge(prev => Math.min(100, prev + gain));

        // 震动
        if (navigator.vibrate && Math.random() > 0.5) navigator.vibrate(20);
    };

    const playCrankSound = () => {
        if (soundRef.current) {
            // 这里 LoopSound 比较简单，不支持动态变速变调，就简单播放
            soundRef.current.play();
        }
    };

    return (
        <div className="h-full bg-slate-900 text-green-500 flex flex-col relative overflow-hidden">
            {/* 顶部返回 */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={onClose} className="p-2 bg-slate-800 rounded-full shadow-sm text-slate-400">
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-12">

                {/* 电池显示 */}
                <div className="flex flex-col items-center gap-2">
                    <div className="w-24 h-12 border-4 border-slate-600 rounded-lg p-1 relative flex items-center">
                        <motion.div
                            className={`h-full rounded-sm ${charge < 20 ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${charge}%` }}
                        // 移除 CSS transition 以实现实时跟手
                        />
                        {/* 电池头 */}
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-2 h-6 bg-slate-600 rounded-r-sm" />

                        {/* 闪电图标 */}
                        {charge > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Zap size={20} className="text-white drop-shadow-md fill-white" />
                            </div>
                        )}
                    </div>
                    <span className="font-mono text-2xl font-bold">{Math.floor(charge)}%</span>
                    <span className="text-xs text-slate-500 opacity-60">请疯狂转动下方摇把充电</span>
                </div>

                {/* 摇把主体 */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* 轮盘 */}
                    <motion.div
                        className="w-48 h-48 rounded-full border-8 border-slate-700 bg-slate-800 relative shadow-2xl"
                        animate={{ rotate: rpm > 0 ? 360 : 0 }} // 这里的动画只是为了视觉，实际上应该跟手
                        // 由于要跟手太复杂，我们做一个"只要在拖动就在转"的视觉欺骗
                        style={{ rotate: charge * 10 }} // 根据电量或者某个累积值转动
                    >
                        {/* 内部辐条 */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-2 bg-slate-700" />
                            <div className="h-full w-2 bg-slate-700" />
                        </div>

                        {/* 把手 (Handle) */}
                        <motion.div
                            className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-24 bg-gradient-to-b from-slate-400 to-slate-600 rounded-full origin-bottom cursor-grab active:cursor-grabbing shadow-xl z-20"
                            drag // 允许拖拽
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // 限制拖拽回弹
                            dragElastic={0.1}
                            onDrag={handlePan}
                        >
                            {/* 把手头 */}
                            <div className="w-12 h-12 bg-red-600 rounded-full absolute -top-4 -left-2 border-4 border-red-800 shadow-inner" />
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* 警告红光 */}
            {charge < 10 && (
                <div className="absolute inset-0 bg-red-900/20 pointer-events-none animate-pulse" />
            )}
        </div>
    );
};

export default HandCrank;
