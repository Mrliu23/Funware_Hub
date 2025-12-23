import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Unlock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

// 游戏配置：3层锁，每层的目标角度
const LAYERS = [
    { target: Math.floor(Math.random() * 300) + 30 }, // 30-330度
    { target: Math.floor(Math.random() * 300) + 30 },
    { target: Math.floor(Math.random() * 300) + 30 },
];

const TOLERANCE = 10; // 容差 +/- 10度

const TheSafe = ({ onClose }) => {
    const [currentLayer, setCurrentLayer] = useState(0); // 0, 1, 2. 3=Unlocked
    const [rotation, setRotation] = useState(0);
    const [isUnlocking, setIsUnlocking] = useState(false); // 正在判定解锁
    const unlockTimer = useRef(null);
    const lastTapAngle = useRef(0);

    // 检查是否在目标区域
    useEffect(() => {
        if (currentLayer >= 3) return;

        try {
            const target = LAYERS[currentLayer].target;
            // 归一化角度到 0-360
            const normalizedRot = ((rotation % 360) + 360) % 360;

            const diff = Math.abs(normalizedRot - target);
            const inZone = diff < TOLERANCE;

            if (inZone) {
                if (!isUnlocking) {
                    // 进入解锁区，开始计时
                    setIsUnlocking(true);
                    unlockTimer.current = setTimeout(() => {
                        successUnlock();
                    }, 1000); // 保持1秒解锁
                }
            } else {
                if (isUnlocking) {
                    // 离开解锁区，取消计时
                    setIsUnlocking(false);
                    if (unlockTimer.current) clearTimeout(unlockTimer.current);
                }
            }
        } catch (e) {
            console.error("Safe logic error:", e);
        }
    }, [rotation, currentLayer]);

    const successUnlock = () => {
        setIsUnlocking(false);
        try {
            playSound('lock_click.mp3'); // 每一层解开的声音
            if (navigator.vibrate) navigator.vibrate([50, 50, 200]);
        } catch (e) { console.error(e); }

        setCurrentLayer(prev => prev + 1);

        if (currentLayer + 1 >= 3) {
            try { playSound('safe_open.mp3'); } catch (e) { }
        }
    };

    const handlePan = (event, info) => {
        if (currentLayer >= 3) return;
        if (!info || !info.delta) return;

        // 计算旋转增量 (简化版，直接用 delta X 映射角度)
        const delta = info.delta.x + (info.delta.y || 0);
        const nextRot = rotation + delta * 0.5;
        setRotation(nextRot);

        // 触觉反馈逻辑
        const normRot = ((nextRot % 360) + 360) % 360;

        // 1. 基础机械刻度感：每 15 度震一下
        if (Math.abs(normRot - lastTapAngle.current) > 15) {
            try {
                playSound('tick_baoxian.mp3');
                if (navigator.vibrate) navigator.vibrate(5);
            } catch (e) { }
            lastTapAngle.current = normRot;
        }

        // 2. 靠近目标时的细腻反馈
        const target = LAYERS[currentLayer] ? LAYERS[currentLayer].target : 0;
        if (Math.abs(normRot - target) < TOLERANCE + 5) {
            if (Math.random() > 0.7 && navigator.vibrate) navigator.vibrate(10);
        }
    };

    return (
        <div className="h-full bg-neutral-900 text-neutral-300 flex flex-col items-center justify-center relative overflow-hidden select-none">
            {/* 顶部返回 */}
            <div className="absolute top-10 left-4 z-20">
                <button onClick={onClose} className="p-2 bg-neutral-800/50 rounded-full shadow-sm text-neutral-400">
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 进度指示灯 */}
            <div className="flex gap-4 mb-12">
                {[0, 1, 2].map(idx => (
                    <div
                        key={idx}
                        className={`w-4 h-4 rounded-full transition-all duration-500 ${idx < currentLayer ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' :
                            (idx === currentLayer ? 'bg-amber-500 animate-pulse' : 'bg-neutral-700')
                            }`}
                    />
                ))}
            </div>

            {/* 保险箱主体 */}
            <div className="relative w-72 h-72 flex items-center justify-center">

                {/* 外部装饰圈 */}
                <div className="absolute inset-0 rounded-full border-8 border-neutral-800 shadow-[inset_0_0_20px_black]" />

                {/* 旋转轮盘 */}
                <motion.div
                    style={{ rotate: rotation }}
                    className="w-56 h-56 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 shadow-2xl flex items-center justify-center relative border-4 border-neutral-600"

                    // 拖拽控制旋转
                    drag="x" // 其实可以是任意方向，handlePan里只取delta
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0}
                    dragMomentum={false}
                    onDrag={handlePan}
                >
                    {/* 金属拉丝纹理模拟 */}
                    <div className="absolute inset-0 rounded-full opacity-20 bg-[conic-gradient(from_0deg,transparent_0deg,#ffffff_90deg,transparent_180deg,#000000_270deg,transparent_360deg)] pointer-events-none" />

                    {/* 旋钮上的刻度线 (装饰用，不代表真实数值) */}
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-2 w-1 h-3 bg-neutral-500/50 rounded-full"
                            style={{ transform: `rotate(${i * 30}deg)`, transformOrigin: "center 108px" }}
                        />
                    ))}

                    {/* 中心大螺母 */}
                    <div className="w-20 h-20 rounded-full bg-neutral-600 shadow-[inset_0_2px_5px_rgba(255,255,255,0.2),0_5px_10px_rgba(0,0,0,0.5)] flex items-center justify-center">
                        <div className="font-mono text-neutral-800/50 font-bold text-xs tracking-widest">SECURE</div>
                    </div>

                    {/* 指示点 */}
                    <div className="absolute top-4 w-4 h-4 bg-orange-500 rounded-full shadow-lg border border-orange-700/50" />

                </motion.div>

                {/* 顶部固定基准线 */}
                <div className="absolute top-0 w-1 h-8 bg-red-600 z-10 rounded-b-full shadow-md" />

            </div>

            {/* 状态提示 */}
            <div className="mt-16 h-8 text-neutral-500 font-mono text-sm tracking-widest">
                {currentLayer >= 3 ? (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        className="text-green-500 flex items-center gap-2 font-bold"
                    >
                        <Unlock size={18} /> OPENED
                    </motion.div>
                ) : (
                    isUnlocking ? (
                        <span className="text-amber-500 animate-pulse">UNLOCKING...</span>
                    ) : "LISTENING..."
                )}
            </div>

            {/* 成功后的战利品展示 */}
            <AnimatePresence>
                {currentLayer >= 3 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute inset-x-8 bottom-12 bg-neutral-800 p-6 rounded-xl border border-neutral-700 text-center"
                    >
                        <h3 className="text-xl font-bold text-amber-500 mb-2">恭喜发财</h3>
                        <p className="text-sm text-neutral-400">你打开了虚空的保险箱。</p>
                        <p className="text-xs text-neutral-600 mt-2">里面只有一张纸条：<br />"耐性是最大的财富"</p>

                        <button onClick={() => { setCurrentLayer(0); setRotation(0); }} className="mt-4 px-6 py-2 bg-neutral-700 rounded-full text-xs font-bold hover:bg-neutral-600">
                            重置锁芯
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TheSafe;
