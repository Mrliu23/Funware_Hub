import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, LoopSound } from '../../utils/audio';

// 烟雾粒子组件 - 负责渲染单个上升的烟雾效果
const SmokeParticle = ({ delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }} // 初始状态：透明，位置原点，较小
        animate={{
            opacity: [0, 0.4, 0], // 透明度变化：淡入 -> 变半透明 -> 淡出
            y: -150, // 向上飘动距离
            x: [0, Math.random() * 30 - 15, Math.random() * 60 - 30], // 在 X 轴随机摆动，模拟随风飘散
            scale: [0.5, 1.5, 2] // 体积逐渐变大
        }}
        transition={{
            duration: 3, // 动画持续3秒
            repeat: Infinity, // 无限循环
            delay: delay, // 延迟开始，错开多个粒子的时间
            ease: "easeOut"
        }}
        className="absolute bottom-full left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-gray-400 blur-md pointer-events-none"
    />
);

// 香支组件 - 显示香、燃烧部分和烟雾
const IncenseStick = ({ burning, progress }) => {
    return (
        <div className="relative w-4 h-64 mx-2 flex flex-col items-center justify-end">
            {/* 香身 (未燃烧部分/香灰) */}
            <div className="w-2 h-full bg-stone-800 rounded-full overflow-hidden relative">
                {/* 遮罩层 - 控制香身长度随燃烧减少（其实是灰色遮盖层向下生长？）
                    更正：这里用 bg-stone-400 代表香灰，随着 progress 增加，香灰从顶部向下延伸。
                */}
                <motion.div
                    className="absolute top-0 left-0 w-full bg-stone-400"
                    animate={{ height: `${progress}%` }}
                />
            </div>

            {/* 香脚 (红色握柄) */}
            <div className="w-1 h-12 bg-amber-900 mt-1" />

            {/* 火星 & 烟雾 - 仅在燃烧时显示 */}
            {burning && (
                <div
                    className="absolute w-4 h-4 rounded-full bg-orange-500 blur-sm flex items-center justify-center animate-pulse"
                    // 根据进度计算火星的位置
                    style={{ bottom: `${(100 - progress) * 0.82 + 18}%` }}
                >
                    <div className="w-1 h-1 bg-yellow-100 rounded-full" />
                    {/* 添加多个烟雾粒子，错开时间 */}
                    <SmokeParticle delay={0} />
                    <SmokeParticle delay={1} />
                    <SmokeParticle delay={2} />
                </div>
            )}
        </div>
    );
};

const CyberIncense = ({ onClose }) => {
    const [burning, setBurning] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('incense_burning') || 'false');
        } catch { return false; }
    });
    const [progress, setProgress] = useState(() => {
        try {
            return parseFloat(localStorage.getItem('incense_progress') || '0');
        } catch { return 0; }
    }); // 燃烧进度：0 (满) 到 100 (烧完)
    const [wish, setWish] = useState(''); // 许愿输入框内容
    const [wishing, setWishing] = useState(false); // 是否正在展示许愿动画
    const loopRef = useRef(null); // 音频循环控制引用

    // 初始化音频
    useEffect(() => {
        loopRef.current = new LoopSound('incense_burn.mp3');
        return () => loopRef.current.stop();
    }, []);

    // 燃烧逻辑控制
    useEffect(() => {
        let interval;
        if (burning && progress < 100) {
            // 开始播放背景音
            loopRef.current.play();
            // 每0.5秒增加进度，模拟缓慢燃烧
            interval = setInterval(() => {
                setProgress(p => Math.min(p + 0.5, 100));
            }, 500);
        } else {
            // 停止燃烧或烧完时，停止声音
            if (loopRef.current) loopRef.current.stop();
        }

        // 烧完自动熄灭
        if (progress >= 100) setBurning(false);

        return () => clearInterval(interval);
        return () => clearInterval(interval);
    }, [burning, progress]);

    // Persistence
    useEffect(() => {
        localStorage.setItem('incense_burning', JSON.stringify(burning));
        localStorage.setItem('incense_progress', progress.toString());
    }, [burning, progress]);

    // 点燃/熄灭处理
    const handleIgnite = () => {
        if (!burning && progress < 100) {
            setBurning(true);
            playSound('gong.mp3'); // 播放开场音效（如敲钟）
        } else {
            setBurning(false);
        }
    };

    // 重置香支
    const handleReset = () => {
        setBurning(false);
        setProgress(0);
    };

    // 提交愿望
    const submitWish = (e) => {
        e.preventDefault();
        if (!wish.trim()) return;

        setWishing(true);
        // 2秒后清除动画状态
        setTimeout(() => {
            setWishing(false);
            setWish('');
        }, 2000);
    };

    return (
        <div className="h-full flex flex-col bg-stone-950 text-stone-100 relative overflow-hidden">
            {/* 顶部返回按钮 */}
            <div className="absolute top-10 left-4 z-10 flex gap-4">
                <button onClick={onClose} className="p-2 bg-stone-800 rounded-full shadow-sm text-stone-400">
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 主要展示区域 */}
            <div className="flex-1 flex flex-col items-center justify-end pb-24 relative">

                {/* 许愿动画：文字化作烟雾飘走 */}
                <AnimatePresence>
                    {wishing && (
                        <motion.div
                            initial={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            animate={{ opacity: 0, y: -200, scale: 3, filter: 'blur(10px)' }} // 向上飘动并模糊消失
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 text-xl font-serif text-stone-300 pointer-events-none whitespace-nowrap"
                        >
                            {wish}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 香炉与香 - 渲染三支香 */}
                <div className="flex items-end justify-center mb-12">
                    <IncenseStick burning={burning} progress={progress} />
                    <IncenseStick burning={burning} progress={progress} />
                    <IncenseStick burning={burning} progress={progress} />
                </div>

                {/* 香炉底座 */}
                <div className="w-48 h-16 bg-gradient-to-b from-amber-700 to-amber-900 rounded-lg shadow-2xl z-10 flex items-center justify-center border-t border-amber-600">
                    <div className="text-amber-400/30 text-xs tracking-[0.5em] font-serif">INCENSE</div>
                </div>
            </div>

            {/* 底部控制区 */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-6 px-8">

                {/* 许愿输入框 */}
                <form onSubmit={submitWish} className="w-full relative">
                    <input
                        type="text"
                        value={wish}
                        onChange={e => setWish(e.target.value)}
                        placeholder="在此许愿，随烟而逝..."
                        className="w-full bg-stone-900/50 border border-stone-800 rounded-full px-4 py-2 text-center text-sm focus:outline-none focus:border-amber-700 transition-colors"
                    />
                </form>

                <div className="flex gap-4">
                    {/* 点燃/熄灭按钮 */}
                    <button
                        onClick={handleIgnite}
                        className={`px-8 py-3 rounded-full font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${burning ? 'bg-orange-900 text-orange-200' : 'bg-amber-600 text-white'}`}
                    >
                        <Flame size={18} className={burning ? 'animate-bounce' : ''} />
                        {burning ? '熄灭' : '点燃'}
                    </button>
                    {/* 更换香支按钮 (仅当有燃烧进度时显示) */}
                    {progress > 0 && (
                        <button
                            onClick={handleReset}
                            className="px-6 py-3 rounded-full bg-stone-800 text-stone-400 text-sm font-bold shadow-lg active:scale-95"
                        >
                            更换
                        </button>
                    )}
                </div>
            </div>

            {/* 氛围遮罩 - 增加一点神秘的橙色光晕 */}
            <div className="absolute inset-0 bg-orange-900/5 pointer-events-none mix-blend-overlay" />
        </div>
    );
};

export default CyberIncense;
