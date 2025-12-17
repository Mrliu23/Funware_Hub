import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoopSound, playSound } from '../../utils/audio';

// 辅助函数：生成随机坐标 (10% 到 90% 之间，避免靠边太近)
const getRandomPos = () => ({
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10
});

const MosquitoHunter = ({ onClose }) => {
    const [mosquitoPos, setMosquitoPos] = useState(getRandomPos()); // 蚊子当前位置
    const [flashOn, setFlashOn] = useState(false); // 屏幕闪光效果
    const [killed, setKilled] = useState(false); // 是否打到蚊子
    const [bloodSpot, setBloodSpot] = useState(null); // 血迹位置
    const loopRef = useRef(null); // 蚊子嗡嗡声循环

    // 初始化音频
    useEffect(() => {
        loopRef.current = new LoopSound('mosquito_fly.mp3');
        loopRef.current.play(); // 进来就开始嗡嗡响
        return () => loopRef.current.stop();
    }, []);

    // 蚊子移动逻辑
    useEffect(() => {
        if (killed) return; // 死了就不动了
        const interval = setInterval(() => {
            setMosquitoPos(getRandomPos()); // 每2秒换个地方
        }, 2000);
        return () => clearInterval(interval);
    }, [killed]);

    // 处理屏幕点击（拍打）
    const handleTap = (e) => {
        if (killed) return;

        // 触发屏幕闪光（模拟开灯或视网膜冲击）
        setFlashOn(true);
        setTimeout(() => setFlashOn(false), 100);

        // 计算点击位置相对于屏幕的百分比
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // 碰撞检测：计算点击点和蚊子位置的距离
        // 判定半径设为 15% (比较宽容)
        const dist = Math.sqrt(Math.pow(x - mosquitoPos.x, 2) + Math.pow(y - mosquitoPos.y, 2));

        if (dist < 15) {
            // 打中了！
            setKilled(true);
            setBloodSpot({ x, y }); // 在点击位置留下血迹
            playSound('slap.mp3'); // 播放惨叫/拍打声
            if (navigator.vibrate) navigator.vibrate(200); // 强震动反馈
            if (loopRef.current) loopRef.current.stop(); // 蚊子不叫了
        } else {
            // 打空了
            playSound('slap.mp3'); // 依然有拍打声
            if (navigator.vibrate) navigator.vibrate(50); // 轻微震动
        }
    };

    // 重置游戏
    const reset = () => {
        setKilled(false);
        setBloodSpot(null);
        setMosquitoPos(getRandomPos());
        if (loopRef.current) loopRef.current.play();
    };

    return (
        <div
            className="h-full bg-stone-900 relative overflow-hidden touch-none"
            onClick={handleTap}
        >
            {/* 顶部返回按钮 */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 bg-white/10 text-white rounded-full">
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 游戏指引文字 */}
            {!killed && (
                <div className="absolute top-20 w-full text-center pointer-events-none opacity-50">
                    <p className="text-white text-xs tracking-widest uppercase">Tap to swat (点击屏幕拍打)</p>
                    <p className="text-white text-[10px] mt-1">Listen carefully... (听声辨位)</p>
                </div>
            )}

            {/* 闪光层 */}
            <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-75 ${flashOn ? 'opacity-20' : 'opacity-0'}`} />

            {/* 蚊子本体 */}
            {/* 注意：opacity-0 让它是完全隐形的，只能靠听（其实这里并没有做立体声定位，纯盲打，或者你可以把opacity-0去掉来测试） */}
            <motion.div
                animate={{ left: `${mosquitoPos.x}%`, top: `${mosquitoPos.y}%` }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 opacity-0" // 设为 0 即完全隐形
            >
                🦟
            </motion.div>

            {/* 胜利后的血迹 */}
            {killed && bloodSpot && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute w-24 h-24 pointer-events-none"
                    style={{ left: `${bloodSpot.x}%`, top: `${bloodSpot.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="w-full h-full bg-red-600 rounded-full blur-md opacity-80" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl">
                        ☠️
                    </div>
                </motion.div>
            )}

            {/* 重置按钮 (胜利后显示) */}
            {killed && (
                <div className="absolute bottom-12 w-full flex justify-center z-20">
                    <button
                        onClick={(e) => { e.stopPropagation(); reset(); }}
                        className="px-8 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg"
                    >
                        NEXT VICTIM (下一只)
                    </button>
                </div>
            )}
        </div>
    );
};

export default MosquitoHunter;
