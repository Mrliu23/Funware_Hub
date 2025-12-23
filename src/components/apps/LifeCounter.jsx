import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Heart, Clock, Sparkles, Sun, Moon, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

/**
 * 生命计数器 (LifeCounter)
 * 显示用户已在地球生活的时间，提醒珍惜每一刻
 */
const LifeCounter = ({ onClose }) => {
    // 生日状态
    const [birthday, setBirthday] = useState(() => {
        return localStorage.getItem('life_counter_birthday') || '';
    });
    const [isSet, setIsSet] = useState(!!birthday);

    // 实时计数
    const [liveStats, setLiveStats] = useState({
        years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0,
        totalDays: 0, totalHours: 0, totalMinutes: 0, totalSeconds: 0,
        heartbeats: 0, breaths: 0
    });

    // 计算时间差
    const calculateLife = () => {
        if (!birthday) return;

        const birth = new Date(birthday);
        const now = new Date();
        const diff = now.getTime() - birth.getTime();

        // 总计数
        const totalSeconds = Math.floor(diff / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        // 年月日
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let days = now.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // 时分秒
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        // 估算心跳和呼吸 (每10秒更新一次以增强节奏感)
        setLiveStats(prev => {
            const shouldUpdateSlowStats = seconds % 10 === 0;
            return {
                years, months, days, hours, minutes, seconds,
                totalDays, totalHours, totalMinutes, totalSeconds,
                heartbeats: shouldUpdateSlowStats ? totalMinutes * 70 : prev.heartbeats || totalMinutes * 70,
                breaths: shouldUpdateSlowStats ? totalMinutes * 15 : prev.breaths || totalMinutes * 15
            };
        });
    };

    // 实时更新
    useEffect(() => {
        if (!birthday) return;
        calculateLife();
        const timer = setInterval(calculateLife, 1000);
        return () => clearInterval(timer);
    }, [birthday]);

    // 保存生日
    const handleSetBirthday = (e) => {
        e.preventDefault();
        if (birthday) {
            localStorage.setItem('life_counter_birthday', birthday);
            setIsSet(true);
            playSound('1.mp3');
        }
    };

    // 重置
    const handleReset = () => {
        localStorage.removeItem('life_counter_birthday');
        setBirthday('');
        setIsSet(false);
        playSound('1.mp3');
    };

    // 格式化大数字
    const formatNumber = (num) => {
        return num.toLocaleString('zh-CN');
    };

    // 判断白天还是夜晚
    const isNight = new Date().getHours() >= 18 || new Date().getHours() < 6;

    return (
        <div className={`h-full flex flex-col overflow-hidden relative ${isNight ? 'bg-slate-950' : 'bg-gradient-to-b from-sky-100 to-amber-50'}`}>

            {/* 背景装饰 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(isNight ? 20 : 8)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 2 + Math.random() * 3,
                            repeat: Infinity,
                            delay: Math.random() * 2
                        }}
                        className={`absolute rounded-full ${isNight ? 'bg-white' : 'bg-amber-300/30'}`}
                        style={{
                            width: isNight ? 2 + Math.random() * 3 : 20 + Math.random() * 30,
                            height: isNight ? 2 + Math.random() * 3 : 20 + Math.random() * 30,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            filter: isNight ? 'none' : 'blur(10px)'
                        }}
                    />
                ))}
            </div>

            {/* 顶部导航 */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`pt-10 pb-4 px-5 flex items-center gap-4 z-20 ${isNight ? 'text-white' : 'text-slate-800'}`}
            >
                <button onClick={onClose} className={`p-2.5 rounded-full ${isNight ? 'bg-white/10' : 'bg-black/5'}`}>
                    <ArrowLeft size={24} />
                </button>
                <div className="flex items-center gap-2">
                    {isNight ? <Moon size={20} className="text-indigo-300" /> : <Sun size={20} className="text-amber-500" />}
                    <h1 className="text-xl font-black tracking-tight">生命计数器</h1>
                </div>
            </motion.div>

            {/* 主内容区 */}
            <div className="flex-1 overflow-y-auto px-6 pb-10 z-10 no-scrollbar">
                <AnimatePresence mode="wait">
                    {!isSet ? (
                        /* 生日输入界面 */
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="flex flex-col items-center justify-center h-full"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 ${isNight ? 'bg-indigo-500/20' : 'bg-amber-200'}`}
                            >
                                <Calendar size={40} className={isNight ? 'text-indigo-300' : 'text-amber-600'} />
                            </motion.div>

                            <h2 className={`text-2xl font-black mb-3 ${isNight ? 'text-white' : 'text-slate-800'}`}>开启你的生命时钟</h2>
                            <p className={`text-xs text-center mb-8 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                                输入你的生日，看看你已在这颗蓝色星球上度过了多少珍贵时光
                            </p>

                            <form onSubmit={handleSetBirthday} className="w-full max-w-xs space-y-4">
                                <input
                                    type="date"
                                    value={birthday}
                                    onChange={(e) => setBirthday(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className={`w-full px-6 py-4 rounded-2xl text-center text-lg font-bold ${isNight
                                        ? 'bg-white/10 text-white border border-white/10'
                                        : 'bg-white text-slate-800 border border-slate-200 shadow-lg'
                                        }`}
                                    required
                                />
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className={`w-full py-4 rounded-2xl font-black text-lg ${isNight
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                        : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                        }`}
                                >
                                    开始计时
                                </motion.button>
                            </form>
                        </motion.div>
                    ) : (
                        /* 计数器显示界面 */
                        <motion.div
                            key="counter"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-6"
                        >
                            {/* 核心年龄展示 */}
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className={`text-center mb-8 p-8 rounded-[2rem] ${isNight ? 'bg-white/5' : 'bg-white/80'} backdrop-blur-xl shadow-xl`}
                            >
                                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                                    你已在地球生活了
                                </p>
                                <div className="flex items-baseline justify-center gap-2">
                                    <motion.span
                                        key={liveStats.years}
                                        initial={{ scale: 1.2, color: '#f59e0b' }}
                                        animate={{ scale: 1, color: isNight ? '#fff' : '#1e293b' }}
                                        className="text-6xl font-black"
                                    >
                                        {liveStats.years}
                                    </motion.span>
                                    <span className={`text-2xl font-bold ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>年</span>
                                    <span className={`text-4xl font-black ${isNight ? 'text-white' : 'text-slate-800'}`}>{liveStats.months}</span>
                                    <span className={`text-lg font-bold ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>月</span>
                                    <span className={`text-4xl font-black ${isNight ? 'text-white' : 'text-slate-800'}`}>{liveStats.days}</span>
                                    <span className={`text-lg font-bold ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>天</span>
                                </div>

                                {/* 实时时钟 */}
                                <div className={`mt-4 text-2xl font-mono font-bold ${isNight ? 'text-indigo-300' : 'text-amber-600'}`}>
                                    <motion.span key={liveStats.seconds} initial={{ opacity: 0.5 }} animate={{ opacity: 1 }}>
                                        {String(liveStats.hours).padStart(2, '0')}:{String(liveStats.minutes).padStart(2, '0')}:
                                        <span className="text-3xl">{String(liveStats.seconds).padStart(2, '0')}</span>
                                    </motion.span>
                                </div>
                            </motion.div>

                            {/* 详细统计 */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { label: '总天数', value: formatNumber(liveStats.totalDays), icon: Calendar, color: 'rose' },
                                    { label: '总小时', value: formatNumber(liveStats.totalHours), icon: Clock, color: 'violet' },
                                    { label: '总分钟', value: formatNumber(liveStats.totalMinutes), icon: Clock, color: 'amber' },
                                    { label: '总秒数', value: formatNumber(liveStats.totalSeconds), icon: Clock, color: 'blue' },
                                    { label: '心跳次数', value: formatNumber(liveStats.heartbeats), icon: Heart, color: 'red' },
                                    { label: '呼吸次数', value: formatNumber(liveStats.breaths), icon: Sparkles, color: 'cyan' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * i }}
                                        className={`p-4 rounded-2xl ${isNight ? 'bg-white/5' : 'bg-white/80'} backdrop-blur-xl`}
                                    >
                                        <stat.icon size={18} className={`mb-2 text-${stat.color}-400`} />
                                        <p className={`text-lg font-black ${isNight ? 'text-white' : 'text-slate-800'}`}>{stat.value}</p>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* 励志语 */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className={`text-center p-6 rounded-2xl ${isNight ? 'bg-indigo-500/10' : 'bg-amber-100'}`}
                            >
                                <Star size={20} className={`mx-auto mb-3 ${isNight ? 'text-indigo-300' : 'text-amber-500'}`} />
                                <p className={`text-sm font-bold ${isNight ? 'text-indigo-200' : 'text-amber-700'}`}>
                                    每一秒都是独一无二的礼物
                                </p>
                                <p className={`text-xs mt-1 ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>
                                    珍惜当下，活出精彩
                                </p>
                            </motion.div>

                            {/* 重置按钮 */}
                            <button
                                onClick={handleReset}
                                className={`mt-8 w-full py-3 rounded-xl text-xs font-bold ${isNight ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}
                            >
                                重新设置生日
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default LifeCounter;
