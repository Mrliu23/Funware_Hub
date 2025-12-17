import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoopSound, playSound } from '../../utils/audio';

const PurrTherapy = ({ onClose }) => {
    const [purring, setPurring] = useState(false); // 是否在呼噜
    const [hearts, setHearts] = useState([]); // 飘出的爱心列表
    const loopRef = useRef(null); // 音频循环控制
    const lastInteractionTime = useRef(0); // 上次触摸时间，用于防抖

    // 初始化呼噜声循环
    useEffect(() => {
        loopRef.current = new LoopSound('cat_purr.mp3');
        return () => loopRef.current.stop();
    }, []);

    // 统一处理触摸和鼠标移动事件
    const handleInteraction = (e) => {
        const now = Date.now();
        // 限制爱心生成频率 (每100ms最多一个)
        if (now - lastInteractionTime.current > 100) {
            // 获取触摸或鼠标位置
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            // 添加一个新爱心到列表
            const id = now;
            setHearts(prev => [...prev, { id, x: clientX, y: clientY }]);
            // 1秒后移除该爱心
            setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 1000);

            // 触发震动反馈 (模仿猫咪呼噜震感)
            if (navigator.vibrate) {
                navigator.vibrate(20);
            }

            lastInteractionTime.current = now;
        }

        // 如果还没开始呼噜，通过触摸触发
        if (!purring) {
            setPurring(true);
            loopRef.current.play(); // 播放呼噜背景音
            playSound('cat_meow.mp3'); // 偶尔叫一声
        }

        // 重置停止计时器：如果2秒内没有触摸，猫咪就停止呼噜
        clearTimeout(window.purrTimeout);
        window.purrTimeout = setTimeout(() => {
            setPurring(false);
            if (loopRef.current) loopRef.current.stop();
        }, 2000);
    };

    return (
        <div
            className="h-full bg-black relative overflow-hidden"
            onMouseMove={handleInteraction}
            onTouchMove={handleInteraction}
            onClick={handleInteraction}
        >
            {/* 顶部返回按钮 */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={onClose} className="p-2 bg-white/20 text-white rounded-full backdrop-blur-md">
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 黑暗中的猫眼 - 仅有的视觉元素 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-12 pointer-events-none">
                {/* 左眼 */}
                <motion.div
                    // 呼噜时眼睛会眯起来
                    animate={{ scaleY: purring ? [1, 0.1, 1] : 1 }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="w-16 h-16 bg-[#ffec8b] rounded-full shadow-[0_0_20px_#ffec8b] relative flex items-center justify-center overflow-hidden"
                >
                    <div className="w-2 h-12 bg-black rounded-full" /> {/* 瞳孔 */}
                </motion.div>
                {/* 右眼 */}
                <motion.div
                    animate={{ scaleY: purring ? [1, 0.1, 1] : 1 }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="w-16 h-16 bg-[#ffec8b] rounded-full shadow-[0_0_20px_#ffec8b] relative flex items-center justify-center overflow-hidden"
                >
                    <div className="w-2 h-12 bg-black rounded-full" />
                </motion.div>
            </div>

            {/* 底部提示文字 */}
            <div className="absolute bottom-12 w-full text-center pointer-events-none">
                <p className="text-white/30 text-sm tracking-widest">{purring ? "Puuurrrrrr..." : "Pet the void. (抚摸虚空)"}</p>
            </div>

            {/* 飘浮的爱心渲染层 */}
            <AnimatePresence>
                {hearts.map(heart => (
                    <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                        // 使用 fixed 定位，确保爱心跟手
                        style={{ position: 'fixed', left: heart.x, top: heart.y }}
                        animate={{ opacity: 0, y: -100, scale: 1.5 }} // 爱心上飘变大消失
                        exit={{ opacity: 0 }}
                        className="text-pink-400 pointer-events-none z-10"
                    >
                        ❤️
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default PurrTherapy;
