import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoopSound } from '../../utils/audio';

// 随机显示的一张美图或文字
const BG_IMAGE = "https://images.unsplash.com/photo-1490750967868-58cb7506a90d?q=80&w=1000";

const FoggyWindow = ({ onClose }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [clearedPercent, setClearedPercent] = useState(0);
    const [isClean, setIsClean] = useState(false);
    const soundRef = useRef(null);

    useEffect(() => {
        soundRef.current = new LoopSound('squeak.mp3');
        initCanvas();
        window.addEventListener('resize', initCanvas);
        return () => {
            window.removeEventListener('resize', initCanvas);
            if (soundRef.current) soundRef.current.stop();
        };
    }, []);

    const initCanvas = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const ctx = canvas.getContext('2d');
        // 绘制雾气 (半透明白色)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 此处可以加一些燥点，模拟真实的雾气质感（略）

        // 恢复之前的擦拭痕迹
        if (wipePaths.current.length > 0) {
            ctx.globalCompositeOperation = 'destination-out';
            wipePaths.current.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 30, 0, Math.PI * 2);
                ctx.fill();
            });
            // 恢复后重新检查进度（简单延迟一下确保渲染完成）
            setTimeout(checkProgress, 100);
        }
    };

    const wipePaths = useRef([]); // 存储擦拭路径点
    const saveTimeout = useRef(null);

    // 加载持久化数据
    useEffect(() => {
        try {
            const saved = localStorage.getItem('foggy_window_paths');
            if (saved) {
                wipePaths.current = JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to load paths", e);
        }
    }, []);

    const savePathsDebounced = () => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            localStorage.setItem('foggy_window_paths', JSON.stringify(wipePaths.current));
        }, 500);
    };

    const handleMove = (e) => {
        if (isClean) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        // 擦除效果：globalCompositeOperation = 'destination-out'
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.fill();

        // 记录路径用于持久化
        wipePaths.current.push({ x, y });
        savePathsDebounced();

        // 播放摩擦声
        if (soundRef.current) soundRef.current.play();
        clearTimeout(window.stopSqueak);
        window.stopSqueak = setTimeout(() => {
            if (soundRef.current) soundRef.current.stop();
        }, 100);

        checkProgress();
    };

    // 检查擦除进度 (为了性能，不要每频都检测，这里简单处理每擦一下检测一次)
    const checkProgress = () => {
        // 这里只是简单地随机增加进度演示，真实情况应该 getImageData 计算 alpha 通道
        // 由于 getImageData 比较消耗性能，我们用简化的判定：
        // 每次擦除就累积一点进度，或者简单地在这里不需太过严谨

        // 严谨实现：每隔一段时间采样
        if (Math.random() > 0.8) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            // 采样 50x50 网格
            const w = canvas.width;
            const h = canvas.height;
            // 抽样检查中心去是否透明
            // (略去复杂计算，不仅慢而且在移动端可能卡顿)

            // 简单Hack：我们根据擦除步数来估算
            setClearedPercent(prev => {
                const next = prev + 0.5;
                if (next > 90) setIsClean(true);
                return next;
            });
        }
    };

    // 真实的像素检查 (可选，如果用户觉得太假再说)
    // 我们可以每秒检查一次
    useEffect(() => {
        const checkInterval = setInterval(() => {
            if (isClean) return;
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            // 为了性能，只取缩略图
            try {
                // 仅对小尺寸采样
                const w = canvas.width;
                const h = canvas.height;
                const step = 20; // 采样步长
                let clearCount = 0;
                let totalCount = 0;

                // getImageData 可能会跨域报错如果画布脏了，但这里我们只画了颜色，没画图片，所以是安全的
                const imageData = ctx.getImageData(0, 0, w, h).data;

                for (let i = 3; i < imageData.length; i += 4 * step) {
                    totalCount++;
                    if (imageData[i] < 128) { // Alpha 通道
                        clearCount++;
                    }
                }

                const percent = (clearCount / totalCount) * 100;
                if (percent > 0) setClearedPercent(percent); // 只更新显示的百分比
                if (percent > 95) setIsClean(true);

            } catch (e) {
                console.error(e);
            }
        }, 500);
        return () => clearInterval(checkInterval);
    }, [isClean]);


    const reset = () => {
        setClearedPercent(0);
        setIsClean(false);
        wipePaths.current = [];
        localStorage.removeItem('foggy_window_paths');
        initCanvas();
    };

    return (
        <div className="h-full bg-black relative overflow-hidden select-none" ref={containerRef}>
            {/* 顶部返回 */}
            <div className="absolute top-10 left-4 z-20">
                <button onClick={onClose} className="p-2 bg-black/50 text-white rounded-full shadow-sm">
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 背景美图 */}
            <div
                className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-1000"
                style={{ backgroundImage: `url(${BG_IMAGE})`, filter: isClean ? 'none' : 'blur(5px)' }}
            />

            {/* 雾气层 Canvas */}
            <canvas
                ref={canvasRef}
                className={`absolute inset-0 z-10 touch-none ${isClean ? 'pointer-events-none opacity-0 transition-opacity duration-1000' : ''}`}
                onMouseMove={handleMove}
                onTouchMove={handleMove}
            />

            {/* 成功后的文字 */}
            {isClean && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/50 backdrop-blur-md p-6 rounded-2xl text-white"
                    >
                        <h2 className="text-2xl font-bold mb-2">好 舒 爽</h2>
                        <p className="text-sm opacity-80">世界清晰了。</p>
                    </motion.div>
                </div>
            )}

            {/* 重置按钮 */}
            {isClean && (
                <div className="absolute bottom-8 w-full flex justify-center z-30">
                    <button onClick={reset} className="p-4 bg-white/20 backdrop-blur-lg rounded-full text-white pointer-events-auto active:scale-95 transition-transform">
                        <RefreshCw size={24} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FoggyWindow;
