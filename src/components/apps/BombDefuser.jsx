import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Scissors } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound, LoopSound } from '../../utils/audio';

const BombDefuser = ({ onClose }) => {
    const [timeLeft, setTimeLeft] = useState(15); // 30秒倒计时
    const [gameState, setGameState] = useState('playing'); // playing, exploded, defused
    const [wires, setWires] = useState([]);
    const tickSound = useRef(null);

    // 初始化游戏
    useEffect(() => {
        // 生成 4 根线，随机指定一根是正确的，一根是爆炸的，其他是无效的（剪了加速）
        const newWires = [
            { id: 0, color: 'bg-red-500', type: 'safe' },
            { id: 1, color: 'bg-blue-500', type: 'safe' },
            { id: 2, color: 'bg-yellow-500', type: 'safe' },
            { id: 3, color: 'bg-green-500', type: 'safe' }
        ];

        // 随机逻辑：
        // 1 根安全拆除线
        // 1 根立即爆炸线
        // 2 根扣时线 (-10s)
        const types = ['defuse', 'boom', 'time_cut', 'time_cut'];
        // Shuffle types
        types.sort(() => Math.random() - 0.5);

        newWires.forEach((w, i) => w.type = types[i]);

        setWires(newWires);

        tickSound.current = new LoopSound('tick.mp3');
        tickSound.current.play();

        return () => tickSound.current.stop();
    }, []);

    // 倒计时逻辑
    useEffect(() => {
        if (gameState !== 'playing') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    explode();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    const explode = () => {
        setGameState('exploded');
        playSound('explosion.mp3');
        if (tickSound.current) tickSound.current.stop();
        if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
    };

    const defuseSuccess = () => {
        setGameState('defused');
        playSound('defused.mp3');
        if (tickSound.current) tickSound.current.stop();
    };

    const cutWire = (index) => {
        if (gameState !== 'playing') return;

        const wire = wires[index];
        if (wire.cut) return; // 已经剪过了

        // 像剪断一样更新 UI
        const updatedWires = [...wires];
        updatedWires[index].cut = true;
        setWires(updatedWires);

        playSound('snip.mp3'); // 剪刀声（可用通用的点击声代替）
        if (navigator.vibrate) navigator.vibrate(50);

        // 处理逻辑
        if (wire.type === 'defuse') {
            defuseSuccess();
        } else if (wire.type === 'boom') {
            explode();
        } else if (wire.type === 'time_cut') {
            setTimeLeft(prev => {
                const newVal = Math.max(0, prev - 2);
                if (newVal === 0) explode();
                return newVal;
            });
            // 提示时间减少
            toast("时间 -2s !!!"); // 或者用 toast，这里简单处理
        }
    };

    const formatTime = (s) => {
        const ms = s < 10 ? `0${s}` : s;
        return `00:${ms}`;
    };

    return (
        <div className="h-full bg-black text-red-600 flex flex-col relative overflow-hidden font-mono">
            {/* 顶部返回 */}
            <div className="absolute top-10 left-4 z-20">
                <button onClick={onClose} className="p-2 bg-gray-800 rounded-full shadow-sm text-gray-400">
                    <ArrowLeft size={24} />
                </button>
            </div>

            {/* 倒计时显示 */}
            <div className="mt-24 flex justify-center">
                <div className="bg-black border-4 border-gray-800 p-4 rounded-lg shadow-[0_0_20px_rgba(255,0,0,0.5)]">
                    <span className={`text-6xl font-bold tracking-widest ${gameState === 'defused' ? 'text-green-500' : 'text-red-500 animate-pulse'}`}>
                        {gameState === 'exploded' ? 'BOOM' : gameState === 'defused' ? 'SAFE' : formatTime(timeLeft)}
                    </span>
                </div>
            </div>

            {/* 炸弹线 */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full px-12 z-10">
                {wires.map((wire, idx) => (
                    <div key={wire.id} className="w-full flex items-center justify-between relative h-12">
                        {/* 线 */}
                        <div className={`absolute left-0 right-0 top-1/2 -translate-y-1/2 h-4 ${wire.color} rounded-full shadow-lg transition-all ${wire.cut ? 'w-[40%] opacity-50' : 'w-full'}`} />
                        {/* 剪断后的右半部分 */}
                        {wire.cut && (
                            <div className={`absolute right-0 top-1/2 -translate-y-1/2 h-4 ${wire.color} w-[40%] rounded-full shadow-lg opacity-50`} />
                        )}

                        {/* 剪断按钮 (覆盖在线上) */}
                        <button
                            onClick={() => cutWire(idx)}
                            disabled={wire.cut || gameState !== 'playing'}
                            className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-gray-800 rounded-full border-2 border-gray-600 flex items-center justify-center active:scale-90 transition-transform z-20"
                        >
                            <Scissors size={20} className="text-gray-300" />
                        </button>
                    </div>
                ))}
            </div>

            {/* 爆炸覆盖层 */}
            {gameState === 'exploded' && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }} // 稍微改一下动画，scale 20 可能太大了看不清内容，改成铺满的全屏层
                    className="absolute inset-0 bg-orange-600 z-50 flex flex-col items-center justify-center gap-8"
                >
                    <div className="text-black font-black text-6xl drop-shadow-lg">BOOM!</div>
                    <div className="text-black font-bold text-2xl">你没了 (YOU DIED)</div>

                    <div className="flex gap-4 mt-8">
                        <button

                            className="px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-900 active:scale-95 transition-transform"
                            onClick={() => {
                                setGameState('playing');
                                setTimeLeft(15);
                                // 重新随机生成线
                                const newWires = [...wires];
                                const types = ['defuse', 'boom', 'time_cut', 'time_cut'];
                                types.sort(() => Math.random() - 0.5);
                                newWires.forEach((w, i) => { w.type = types[i]; w.cut = false; });
                                setWires(newWires);
                                if (tickSound.current) tickSound.current.play();
                            }}
                        >
                            再试一次
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-white/20 text-black font-bold rounded-full hover:bg-white/30 active:scale-95 transition-transform"
                        >
                            退出
                        </button>
                    </div>
                </motion.div>
            )}

            {/* 成功覆盖层 (可选) */}
            {gameState === 'defused' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-green-600/90 z-50 flex flex-col items-center justify-center gap-8"
                >
                    <div className="text-white font-black text-5xl drop-shadow-lg">SAFE</div>
                    <div className="text-white font-bold text-xl">拆弹成功 (Counter-Terrorists Win)</div>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-3 bg-white text-green-700 font-bold rounded-full shadow-lg active:scale-95">返回</button>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default BombDefuser;
