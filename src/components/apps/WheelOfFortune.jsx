import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit3, RotateCcw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

const LS_KEY = 'wheel_fortune_data';

// 预设转盘模板
const PRESETS = {
    food: {
        name: '今天吃什么',
        options: ['火锅', '麻辣烫', '披萨', '汉堡', '寿司', '烧烤', '面条', '饺子'],
    },
    decision: {
        name: '做什么决定',
        options: ['去做', '不做', '明天再说', '先等等', '问问朋友', '随缘吧'],
    },
    activity: {
        name: '周末干嘛',
        options: ['看电影', '打游戏', '逛街', '睡觉', '学习', '健身', '约朋友', '宅家'],
    },
};

// 扇区颜色列表 (循环使用)
const COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
    '#f43f5e', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa', '#a78bfa', '#f472b6',
];

const WheelOfFortune = ({ onClose }) => {
    // 状态管理
    const [options, setOptions] = useState(PRESETS.food.options);
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0); // 当前旋转角度
    const [result, setResult] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editText, setEditText] = useState('');
    const [showPresets, setShowPresets] = useState(false);

    const wheelRef = useRef(null);
    const lastTickRef = useRef(0); // 用于控制tick音效频率

    // 初始化：加载本地保存的自定义选项
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                if (data.options && Array.isArray(data.options)) {
                    setOptions(data.options);
                }
            }
        } catch (e) {
            console.warn('读取转盘存档失败:', e);
        }
    }, []);

    // 自动保存：选项改变时保存到本地
    useEffect(() => {
        if (options !== PRESETS.food.options) {
            localStorage.setItem(LS_KEY, JSON.stringify({ options }));
        }
    }, [options]);

    // 监听旋转动画以播放 Tick 音效
    // 这是一个简化的实现，通过RAF检测旋转角度变化
    useEffect(() => {
        if (!isSpinning) return;

        // 音效播放逻辑已经在CSS动画中很难精确同步
        // 但我们可以模拟：动画持续4秒，我们在前3秒播放快速Tick，最后减速
        // 为了简单可靠，这里使用定时器模拟声音

        const duration = 4000;
        const startTime = Date.now();
        let tickInterval;

        const playTick = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed >= duration) return;

            // 根据时间调整播放间隔，模拟减速效果
            // 0-2s: 快速 (50ms)
            // 2-3s: 中速 (100ms)
            // 3-4s: 慢速 (200ms -> 停止)
            let interval = 50;
            if (elapsed > 2000) interval = 100;
            if (elapsed > 3000) interval = 200 + (elapsed - 3000) / 5;

            playSound('1.mp3');
            tickInterval = setTimeout(playTick, interval);
        };

        playTick();

        return () => clearTimeout(tickInterval);
    }, [isSpinning]);

    // 旋转转盘的核心逻辑
    const spin = useCallback(() => {
        if (isSpinning || options.length < 2) return;

        setIsSpinning(true);
        setShowResult(false);
        playSound('1.mp3'); // 开始时播放一声

        const segmentAngle = 360 / options.length;

        // 核心算法：先确定结果，再反推角度
        // 1. 随机选择结果索引
        const resultIndex = Math.floor(Math.random() * options.length);

        // 2. 计算让指针指向该扇区中心所需的最终旋转角度
        // 公式推导：
        // 转盘顺时针旋转，0号扇区初始在顶部。
        // 当 rotation = R 时，顶部的扇区索引为：floor(((360 - R%360)%360) / segmentAngle)
        // 为了让结果 resultIndex 在顶部，我们需要旋转到特定的归一化角度 targetNormalized
        // targetNormalized = 360 - (resultIndex + 0.5) * segmentAngle
        const targetNormalized = ((360 - (resultIndex + 0.5) * segmentAngle) % 360 + 360) % 360;

        // 3. 计算从当前位置需要额外旋转多少度
        const currentNormalized = ((rotation % 360) + 360) % 360;
        let additionalRotation = targetNormalized - currentNormalized;
        if (additionalRotation <= 0) additionalRotation += 360;

        // 4. 加上随机圈数（5-10圈）增加悬念
        const spins = 5 + Math.floor(Math.random() * 5);
        const totalRotation = rotation + spins * 360 + additionalRotation;

        setRotation(totalRotation);
        setResult(options[resultIndex]);

        // 等待动画结束后显示结果 (动画持续4s)
        setTimeout(() => {
            setIsSpinning(false);
            setTimeout(() => {
                setShowResult(true);
                playSound('1.mp3'); // 胜利音效
            }, 300);
        }, 4000);
    }, [isSpinning, options, rotation]);

    // 添加新选项
    const addOption = () => {
        if (editText.trim() && options.length < 12) {
            setOptions([...options, editText.trim()]);
            setEditText('');
            playSound('1.mp3');
        }
    };

    // 删除选项
    const removeOption = (index) => {
        setOptions(options.filter((_, i) => i !== index));
        playSound('1.mp3');
    };

    // 加载预设模板
    const loadPreset = (key) => {
        setOptions(PRESETS[key].options);
        setShowPresets(false);
        setRotation(0);
        playSound('1.mp3');
    };

    // 绘制饼图扇区 (SVG)
    const segmentAngle = 360 / options.length;

    return (
        <div className="h-full bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col">
            {/* 顶部工具栏 */}
            <div className="flex items-center justify-between pt-10 pb-4 px-4">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
                    <ArrowLeft size={24} className="text-white" />
                </button>
                <h1 className="text-xl font-bold text-white">🎰 命运转盘</h1>
                <button onClick={() => { setShowEdit(!showEdit); playSound('1.mp3'); }} className="p-2 bg-white/10 rounded-full">
                    <Edit3 size={20} className="text-white" />
                </button>
            </div>

            {/* 转盘显示区域 */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* 顶部指针 - 使用CSS绘制 */}
                <div className="absolute top-[calc(50%-140px)] left-1/2 -translate-x-1/2 z-10">
                    <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[30px] border-l-transparent border-r-transparent border-t-white drop-shadow-lg" />
                </div>

                {/* 转盘实体 - SVG绘制 */}
                <motion.div
                    ref={wheelRef}
                    className="relative w-72 h-72"
                    animate={{ rotate: rotation }}
                    transition={{ duration: 4, ease: [0.25, 0.1, 0.25, 1] }} // Bezier曲线模拟真实的物理减速
                >
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                        {options.map((option, i) => {
                            // 计算每个扇区的路径
                            const startAngle = i * segmentAngle - 90; // -90 使其从顶部开始
                            const endAngle = startAngle + segmentAngle;

                            // SVG 弧形路径参数计算
                            const x1 = 100 + 95 * Math.cos((startAngle * Math.PI) / 180);
                            const y1 = 100 + 95 * Math.sin((startAngle * Math.PI) / 180);
                            const x2 = 100 + 95 * Math.cos((endAngle * Math.PI) / 180);
                            const y2 = 100 + 95 * Math.sin((endAngle * Math.PI) / 180);
                            const largeArc = segmentAngle > 180 ? 1 : 0;

                            // 文字位置计算 (扇区中心)
                            const midAngle = (startAngle + endAngle) / 2;
                            const textX = 100 + 55 * Math.cos((midAngle * Math.PI) / 180);
                            const textY = 100 + 55 * Math.sin((midAngle * Math.PI) / 180);

                            return (
                                <g key={i}>
                                    {/* 扇形区域 */}
                                    <path
                                        d={`M 100 100 L ${x1} ${y1} A 95 95 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                        fill={COLORS[i % COLORS.length]}
                                        stroke="white"
                                        strokeWidth="1"
                                    />
                                    {/* 选项文字 */}
                                    <text
                                        x={textX}
                                        y={textY}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fill="white"
                                        fontSize={options.length > 8 ? "6" : "8"}
                                        fontWeight="bold"
                                        transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                                        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                                    >
                                        {option.length > 4 ? option.slice(0, 4) + '..' : option}
                                    </text>
                                </g>
                            );
                        })}
                        {/* 中心装饰圆 */}
                        <circle cx="100" cy="100" r="15" fill="white" />
                        <circle cx="100" cy="100" r="12" fill="#4f46e5" />
                    </svg>
                </motion.div>
            </div>

            {/* 底部操作区 */}
            <div className="flex justify-center pb-6">
                <button
                    onClick={spin}
                    disabled={isSpinning || options.length < 2}
                    className={`px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-2 transition-all ${isSpinning ? 'bg-gray-500 text-gray-300' : 'bg-white text-indigo-900 active:scale-95'
                        }`}
                >
                    <RotateCcw size={24} className={isSpinning ? 'animate-spin' : ''} />
                    {isSpinning ? '转动中...' : '转动命运'}
                </button>
            </div>

            {/* 快速预设按钮组 */}
            <div className="flex justify-center gap-2 pb-6">
                {Object.entries(PRESETS).map(([key, preset]) => (
                    <button
                        key={key}
                        onClick={() => loadPreset(key)}
                        className="px-3 py-1 bg-white/10 rounded-full text-white/70 text-xs hover:bg-white/20"
                    >
                        {preset.name}
                    </button>
                ))}
            </div>

            {/* 结果弹窗 */}
            <AnimatePresence>
                {showResult && result && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"
                        onClick={() => setShowResult(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="bg-gradient-to-br from-amber-400 to-orange-500 p-8 rounded-3xl text-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Sparkles size={48} className="text-white mx-auto mb-4" />
                            <h2 className="text-white/80 text-sm mb-2">命运选择了</h2>
                            <p className="text-3xl font-black text-white mb-4">{result}</p>
                            <button
                                onClick={() => setShowResult(false)}
                                className="px-6 py-2 bg-white/20 rounded-xl text-white font-medium"
                            >
                                知道了
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 编辑面板 (从底部滑出) */}
            <AnimatePresence>
                {showEdit && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 z-30"
                            onClick={() => setShowEdit(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl p-6 z-40 max-h-[60%] overflow-auto"
                        >
                            <h3 className="text-white font-bold text-lg mb-4">编辑选项</h3>

                            {/* 添加新选项输入框 */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                                    placeholder="输入新选项..."
                                    className="flex-1 px-4 py-2 bg-white/10 rounded-xl text-white placeholder:text-white/50"
                                    maxLength={10}
                                />
                                <button
                                    onClick={addOption}
                                    disabled={options.length >= 12}
                                    className="p-2 bg-indigo-500 rounded-xl text-white"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>

                            {/* 现有选项列表 */}
                            <div className="space-y-2">
                                {options.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-white/5 rounded-xl p-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                        />
                                        <span className="flex-1 text-white">{opt}</span>
                                        <button
                                            onClick={() => removeOption(i)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <p className="text-white/40 text-xs text-center mt-4">
                                {options.length}/12 个选项
                            </p>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WheelOfFortune;
