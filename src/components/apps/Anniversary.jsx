import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, Trash2, Heart, Calendar, Gift, Camera, Bell, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

/**
 * 纪念日 (Anniversary)
 * 记录生活中重要的瞬间，支持自定义与实时计算
 */
const Anniversary = ({ onClose }) => {
    // 纪念日清单
    const [events, setEvents] = useState(() => {
        try {
            const saved = localStorage.getItem('system_anniversaries');
            return saved ? JSON.parse(saved) : [
                { id: '1', title: '相恋纪念日', date: '2023-01-01', icon: 'heart', color: 'rose' },
                { id: '2', title: '入职纪念日', date: '2022-06-15', icon: 'star', color: 'amber' }
            ];
        } catch { return []; }
    });

    // 表单状态
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState({ title: '', date: '', icon: 'heart', color: 'rose' });

    useEffect(() => {
        localStorage.setItem('system_anniversaries', JSON.stringify(events));
    }, [events]);

    // 计算天数
    const calculateTime = (dateStr) => {
        const target = new Date(dateStr);
        const now = new Date();
        // 归一化日期，忽略具体分秒
        const d1 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const diff = d2.getTime() - d1.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        return {
            val: Math.abs(days),
            isFuture: days < 0,
            isToday: days === 0
        };
    };

    // 图标组件映射
    const IconMap = {
        heart: Heart,
        calendar: Calendar,
        gift: Gift,
        star: Star,
        camera: Camera,
        bell: Bell
    };

    // 添加记录
    const handleAdd = () => {
        if (!formData.title || !formData.date) return;
        playSound('1.mp3');
        // 使用更唯一的 ID
        setEvents([...events, { ...formData, id: `anniv-${Date.now()}` }]);
        setFormData({ title: '', date: '', icon: 'heart', color: 'rose' });
        setIsAdding(false);
    };

    // 删除记录
    const handleDelete = (id) => {
        playSound('1.mp3');
        // 显式过滤，考虑 ID 类型
        setEvents(prev => prev.filter(e => String(e.id) !== String(id)));
    };

    return (
        <div className="h-full bg-zinc-950 flex flex-col text-white overflow-hidden relative">
            {/* 顶部动态颗粒 */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#3b82f6_0%,_transparent_50%)]" />
            </div>

            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pt-10 pb-5 px-5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-2xl border-b border-white/5 z-20"
            >
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-black italic tracking-tighter">时光轴</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="p-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30"
                >
                    <Plus size={20} />
                </button>
            </motion.div>

            <div className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar z-10">
                <div className="space-y-4 pb-20">
                    <AnimatePresence>
                        {events.map((event, idx) => {
                            const Icon = IconMap[event.icon] || Heart;
                            const { val, isFuture, isToday } = calculateTime(event.date);
                            return (
                                <motion.div
                                    key={event.id}
                                    layout
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white/5 rounded-3xl p-5 border border-white/10 flex items-center justify-between group overflow-hidden relative"
                                >
                                    {/* 背景装饰 */}
                                    <div className={`absolute -right-4 -bottom-4 w-20 h-20 opacity-10 bg-${event.color}-500 blur-2xl rounded-full`} />

                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${isFuture ? 'bg-indigo-500/20' : `bg-${event.color}-500/20`}`}>
                                            <Icon className={isFuture ? 'text-indigo-400' : `text-${event.color}-400`} size={24} />
                                        </div>
                                        <div className="max-w-[120px]">
                                            <h3 className="font-black text-lg tracking-tight truncate">{event.title}</h3>
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{event.date}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-2xl font-black ${isFuture ? 'text-indigo-400' : `text-${event.color}-400`}`}>
                                                {isToday ? '今天' : val}
                                            </span>
                                            {!isToday && <span className="text-[10px] font-black opacity-50 uppercase">Days</span>}
                                        </div>
                                        <div className="text-[9px] font-black uppercase tracking-tighter opacity-40 leading-none">
                                            {isToday ? '就在此刻' : (isFuture ? '距离还有' : '已经过去')}
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDelete(event.id);
                                            }}
                                            className="mt-1 p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/10 active:scale-75 z-20"
                                            title="删除"
                                        >
                                            <Trash2 size={18} className="text-red-400/80 hover:text-red-400" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* 新增弹窗 */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex flex-col justify-end p-4 bg-black/60 backdrop-blur-md"
                        onClick={() => setIsAdding(false)}
                    >
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-zinc-900 rounded-[2.5rem] p-8 border border-white/10"
                        >
                            <h2 className="text-2xl font-black mb-6">新增瞬间</h2>
                            <div className="space-y-4">
                                <input
                                    placeholder="名称 (如：相遇那天)"
                                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white font-bold"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-white font-bold"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                                <div className="flex gap-4 justify-around p-2 bg-white/5 rounded-2xl">
                                    {['rose', 'blue', 'amber', 'emerald'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFormData({ ...formData, color: c })}
                                            className={`w-8 h-8 rounded-full bg-${c}-500 ${formData.color === c ? 'ring-4 ring-white' : ''}`}
                                        />
                                    ))}
                                </div>
                                <div className="grid grid-cols-6 gap-2 bg-white/5 p-4 rounded-2xl">
                                    {Object.keys(IconMap).map(icon => {
                                        const TargetIcon = IconMap[icon];
                                        return (
                                            <button
                                                key={icon}
                                                onClick={() => setFormData({ ...formData, icon })}
                                                className={`p-2 rounded-xl flex justify-center ${formData.icon === icon ? 'bg-white/20' : 'hover:bg-white/10'}`}
                                            >
                                                <TargetIcon size={20} />
                                            </button>
                                        );
                                    })}
                                </div>
                                <button
                                    onClick={handleAdd}
                                    className="w-full py-5 bg-blue-600 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    记录入此时刻
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tailwind 颜色白名单注入 (防止动态编译缺失) */}
            <div className="hidden bg-rose-500 bg-blue-500 bg-amber-500 bg-emerald-500 bg-rose-500/20 bg-blue-500/20 bg-amber-500/20 bg-emerald-500/20 text-rose-400 text-blue-400 text-amber-400 text-emerald-400" />
        </div>
    );
};

export default Anniversary;
