import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, BarChart3, Calendar as CalendarIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LS_KEY = 'mood_journal_data';

// 心情类型
const MOODS = [
    { id: 'great', emoji: '😄', label: '超开心', color: '#22c55e' },
    { id: 'good', emoji: '🙂', label: '不错', color: '#84cc16' },
    { id: 'meh', emoji: '😐', label: '一般', color: '#eab308' },
    { id: 'bad', emoji: '😔', label: '不太好', color: '#f97316' },
    { id: 'awful', emoji: '😢', label: '很糟糕', color: '#ef4444' },
];

// 获取月份天数
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// 获取月份第一天是周几 (0-6, 0是周日)
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

const MoodJournal = ({ onClose }) => {
    const [entries, setEntries] = useState({});
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [view, setView] = useState('calendar'); // calendar, stats
    const [noteText, setNoteText] = useState('');

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const today = new Date();

    // 加载数据
    useEffect(() => {
        try {
            const saved = localStorage.getItem(LS_KEY);
            if (saved) {
                setEntries(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load mood journal:', e);
        }
    }, []);

    // 保存数据
    const saveEntries = (newEntries) => {
        setEntries(newEntries);
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(newEntries));
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    };

    // 选择心情
    const selectMood = (moodId) => {
        if (!selectedDate) return;
        const key = selectedDate.toISOString().split('T')[0];
        const newEntries = {
            ...entries,
            [key]: { mood: moodId, note: noteText, date: key }
        };
        saveEntries(newEntries);
        setSelectedDate(null);
        setNoteText('');
    };

    // 删除记录
    const deleteEntry = () => {
        if (!selectedDate) return;
        const key = selectedDate.toISOString().split('T')[0];
        const newEntries = { ...entries };
        delete newEntries[key];
        saveEntries(newEntries);
        setSelectedDate(null);
        setNoteText('');
    };

    // 生成日历数据
    const calendarDays = useMemo(() => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const days = [];

        // 填充空白
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // 填充日期
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(currentYear, currentMonth, d);
            const key = date.toISOString().split('T')[0];
            days.push({
                day: d,
                date,
                key,
                entry: entries[key],
                isToday: d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear(),
                isFuture: date > today,
            });
        }

        return days;
    }, [currentYear, currentMonth, entries, today]);

    // 统计数据
    const stats = useMemo(() => {
        const monthEntries = Object.values(entries).filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const moodCounts = {};
        MOODS.forEach(m => moodCounts[m.id] = 0);
        monthEntries.forEach(e => {
            if (moodCounts[e.mood] !== undefined) moodCounts[e.mood]++;
        });

        const total = monthEntries.length;

        return { moodCounts, total };
    }, [entries, currentMonth, currentYear]);

    // 月份导航
    const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1));
    const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1));

    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    return (
        <div className="h-full bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
            {/* 顶部栏 */}
            <div className="flex items-center justify-between pt-10 pb-4 px-4">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full">
                    <ArrowLeft size={24} className="text-white" />
                </button>
                <h1 className="text-lg font-bold text-white">📔 情绪日记</h1>
                <button
                    onClick={() => setView(view === 'calendar' ? 'stats' : 'calendar')}
                    className="p-2 bg-white/10 rounded-full"
                >
                    {view === 'calendar' ? <BarChart3 size={20} className="text-white" /> : <CalendarIcon size={20} className="text-white" />}
                </button>
            </div>

            {/* 月份导航 */}
            <div className="flex items-center justify-between px-6 pb-4">
                <button onClick={prevMonth} className="p-2 text-white/60">
                    <ChevronLeft size={24} />
                </button>
                <span className="text-white font-bold text-lg">
                    {currentYear}年 {monthNames[currentMonth]}
                </span>
                <button onClick={nextMonth} className="p-2 text-white/60">
                    <ChevronRight size={24} />
                </button>
            </div>

            {view === 'calendar' ? (
                <>
                    {/* 日历视图 */}
                    <div className="flex-1 px-4">
                        {/* 星期标题 */}
                        <div className="grid grid-cols-7 mb-2">
                            {weekDays.map(d => (
                                <div key={d} className="text-center text-white/50 text-xs py-2">{d}</div>
                            ))}
                        </div>

                        {/* 日期格子 */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map((item, i) => (
                                <div
                                    key={i}
                                    onClick={() => item && !item.isFuture && setSelectedDate(item.date)}
                                    className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all ${!item ? '' :
                                        item.isFuture ? 'opacity-30 cursor-not-allowed' :
                                            item.isToday ? 'bg-indigo-500/30 ring-2 ring-indigo-400' :
                                                item.entry ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                                        }`}
                                >
                                    {item && (
                                        <>
                                            <span className={`text-xs ${item.isToday ? 'text-indigo-300 font-bold' : 'text-white/60'}`}>
                                                {item.day}
                                            </span>
                                            {item.entry && (
                                                <span className="text-lg">
                                                    {MOODS.find(m => m.id === item.entry.mood)?.emoji}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 本月统计简览 */}
                    <div className="p-4 bg-white/5 mx-4 mb-4 rounded-2xl">
                        <div className="flex justify-around">
                            {MOODS.map(mood => (
                                <div key={mood.id} className="text-center">
                                    <div className="text-2xl">{mood.emoji}</div>
                                    <div className="text-white font-bold">{stats.moodCounts[mood.id]}</div>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-white/40 text-xs mt-2">
                            本月记录 {stats.total} 天
                        </p>
                    </div>
                </>
            ) : (
                /* 统计视图 */
                <div className="flex-1 px-6 py-4">
                    <h2 className="text-white font-bold mb-4">本月心情分布</h2>

                    {stats.total === 0 ? (
                        <div className="text-center text-white/50 py-12">
                            <p className="text-4xl mb-4">📊</p>
                            <p>本月还没有记录</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {MOODS.map(mood => {
                                const count = stats.moodCounts[mood.id];
                                const percent = stats.total > 0 ? (count / stats.total) * 100 : 0;

                                return (
                                    <div key={mood.id} className="flex items-center gap-3">
                                        <span className="text-2xl w-8">{mood.emoji}</span>
                                        <div className="flex-1">
                                            <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    className="h-full rounded-full"
                                                    style={{ backgroundColor: mood.color }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-white w-12 text-right">
                                            {count}天
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 饼图 */}
                    {stats.total > 0 && (
                        <div className="mt-8 flex justify-center">
                            <svg viewBox="0 0 100 100" className="w-48 h-48">
                                {(() => {
                                    let currentAngle = 0;
                                    return MOODS.map(mood => {
                                        const count = stats.moodCounts[mood.id];
                                        if (count === 0) return null;

                                        const percent = count / stats.total;
                                        const angle = percent * 360;
                                        const startAngle = currentAngle;
                                        const endAngle = currentAngle + angle;
                                        currentAngle = endAngle;

                                        const x1 = 50 + 45 * Math.cos((startAngle - 90) * Math.PI / 180);
                                        const y1 = 50 + 45 * Math.sin((startAngle - 90) * Math.PI / 180);
                                        const x2 = 50 + 45 * Math.cos((endAngle - 90) * Math.PI / 180);
                                        const y2 = 50 + 45 * Math.sin((endAngle - 90) * Math.PI / 180);
                                        const largeArc = angle > 180 ? 1 : 0;

                                        return (
                                            <path
                                                key={mood.id}
                                                d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                                fill={mood.color}
                                            />
                                        );
                                    });
                                })()}
                                <circle cx="50" cy="50" r="20" fill="#1e293b" />
                            </svg>
                        </div>
                    )}
                </div>
            )}

            {/* 选择心情弹窗 */}
            <AnimatePresence>
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 flex items-end justify-center z-50"
                        onClick={() => { setSelectedDate(null); setNoteText(''); }}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full bg-slate-800 rounded-t-3xl p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-bold text-lg">
                                    {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日 心情
                                </h3>
                                <button onClick={() => { setSelectedDate(null); setNoteText(''); }}>
                                    <X size={24} className="text-white/60" />
                                </button>
                            </div>

                            {/* 心情选择 */}
                            <div className="flex justify-around mb-6">
                                {MOODS.map(mood => (
                                    <button
                                        key={mood.id}
                                        onClick={() => selectMood(mood.id)}
                                        className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                                    >
                                        <span className="text-4xl">{mood.emoji}</span>
                                        <span className="text-white/60 text-xs">{mood.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* 备注输入 */}
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="写点什么... (可选)"
                                className="w-full h-20 bg-white/10 rounded-xl p-3 text-white placeholder:text-white/30 resize-none mb-4"
                                maxLength={100}
                            />

                            {/* 删除按钮（如果已有记录） */}
                            {entries[selectedDate.toISOString().split('T')[0]] && (
                                <button
                                    onClick={deleteEntry}
                                    className="w-full py-2 text-red-400 text-sm"
                                >
                                    删除此记录
                                </button>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MoodJournal;
