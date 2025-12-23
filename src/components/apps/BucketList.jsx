import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Check, Trash2, Star, Sparkles, Target, Edit3, X, Rocket } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { playSound } from '../../utils/audio';

/**
 * 梦想清单 (BucketList)
 * 记录人生想做的事情，完成后打勾
 */
const BucketList = ({ onClose }) => {
    // 清单数据
    const [dreams, setDreams] = useState(() => {
        try {
            const saved = localStorage.getItem('bucket_list_dreams');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // UI 状态
    const [isAdding, setIsAdding] = useState(false);
    const [newDream, setNewDream] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'done'

    // 持久化
    useEffect(() => {
        localStorage.setItem('bucket_list_dreams', JSON.stringify(dreams));
    }, [dreams]);

    // 添加梦想
    const handleAdd = () => {
        if (!newDream.trim()) return;
        playSound('1.mp3');
        setDreams([
            ...dreams,
            { id: Date.now(), text: newDream.trim(), done: false, createdAt: new Date().toISOString() }
        ]);
        setNewDream('');
        setIsAdding(false);
    };

    // 切换完成状态
    const toggleDone = (id) => {
        playSound('1.mp3');
        setDreams(dreams.map(d => d.id === id ? { ...d, done: !d.done, doneAt: !d.done ? new Date().toISOString() : null } : d));
    };

    // 删除
    const handleDelete = (id) => {
        playSound('1.mp3');
        setDreams(dreams.filter(d => d.id !== id));
    };

    // 编辑
    const startEdit = (dream) => {
        setEditingId(dream.id);
        setEditText(dream.text);
    };

    const saveEdit = () => {
        if (!editText.trim()) return;
        playSound('1.mp3');
        setDreams(dreams.map(d => d.id === editingId ? { ...d, text: editText.trim() } : d));
        setEditingId(null);
    };

    // 筛选后的列表
    const filteredDreams = dreams.filter(d => {
        if (filter === 'pending') return !d.done;
        if (filter === 'done') return d.done;
        return true;
    });

    // 统计
    const stats = {
        total: dreams.length,
        done: dreams.filter(d => d.done).length,
        pending: dreams.filter(d => !d.done).length,
        progress: dreams.length > 0 ? Math.round((dreams.filter(d => d.done).length / dreams.length) * 100) : 0
    };

    return (
        <div className="h-full bg-gradient-to-b from-violet-950 via-purple-900 to-fuchsia-900 flex flex-col text-white overflow-hidden relative">

            {/* 背景星星 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(30)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                        className="absolute bg-white rounded-full"
                        style={{
                            width: 1 + Math.random() * 3,
                            height: 1 + Math.random() * 3,
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                    />
                ))}
            </div>

            {/* 顶部导航 */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pt-10 pb-4 px-5 flex items-center justify-between z-20"
            >
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2.5 bg-white/10 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Rocket size={20} className="text-fuchsia-300" />
                        <h1 className="text-xl font-black tracking-tight">梦想清单</h1>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsAdding(true)}
                    className="p-2.5 bg-fuchsia-500 rounded-full shadow-lg shadow-fuchsia-500/30"
                >
                    <Plus size={20} />
                </motion.button>
            </motion.div>

            {/* 进度统计 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-5 mb-4 p-5 bg-white/5 backdrop-blur-xl rounded-[1.5rem] border border-white/10"
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Target size={16} className="text-fuchsia-300" />
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-300">人生进度</span>
                    </div>
                    <span className="text-2xl font-black text-fuchsia-300">{stats.progress}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.progress}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-400 rounded-full"
                    />
                </div>
                <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>已完成 {stats.done}</span>
                    <span>共 {stats.total} 个梦想</span>
                </div>
            </motion.div>

            {/* 筛选器 */}
            <div className="flex gap-2 px-5 mb-4">
                {[
                    { id: 'all', label: '全部' },
                    { id: 'pending', label: '进行中' },
                    { id: 'done', label: '已实现' },
                ].map((f) => (
                    <button
                        key={f.id}
                        onClick={() => { setFilter(f.id); playSound('1.mp3'); }}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id
                            ? 'bg-fuchsia-500 text-white'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* 清单列表 */}
            <div className="flex-1 overflow-y-auto px-5 pb-10 no-scrollbar z-10">
                {filteredDreams.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center"
                    >
                        <Sparkles size={48} className="text-fuchsia-400/50 mb-4" />
                        <p className="text-sm font-bold text-slate-400">
                            {filter === 'done' ? '还没有实现的梦想' : filter === 'pending' ? '没有进行中的梦想' : '点击右上角 + 添加你的第一个梦想'}
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {filteredDreams.map((dream, index) => (
                                <motion.div
                                    key={dream.id}
                                    layout
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 50, scale: 0.8 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`p-4 rounded-2xl backdrop-blur-xl border transition-all ${dream.done
                                        ? 'bg-fuchsia-500/10 border-fuchsia-500/20'
                                        : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* 完成按钮 */}
                                        <motion.button
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => toggleDone(dream.id)}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${dream.done
                                                ? 'bg-fuchsia-500 text-white'
                                                : 'bg-white/10 border-2 border-white/30'
                                                }`}
                                        >
                                            {dream.done && <Check size={14} />}
                                        </motion.button>

                                        {/* 内容 */}
                                        <div className="flex-1 min-w-0">
                                            {editingId === dream.id ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editText}
                                                        onChange={(e) => setEditText(e.target.value)}
                                                        className="flex-1 bg-white/10 px-3 py-1 rounded-lg text-sm"
                                                        autoFocus
                                                    />
                                                    <button onClick={saveEdit} className="p-1 bg-fuchsia-500 rounded-lg">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 bg-white/10 rounded-lg">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className={`text-sm font-bold leading-relaxed ${dream.done ? 'line-through text-slate-400' : 'text-white'}`}>
                                                    {dream.text}
                                                </p>
                                            )}
                                            {dream.done && dream.doneAt && (
                                                <p className="text-[9px] text-fuchsia-300 mt-1 flex items-center gap-1">
                                                    <Star size={10} /> 实现于 {new Date(dream.doneAt).toLocaleDateString('zh-CN')}
                                                </p>
                                            )}
                                        </div>

                                        {/* 操作按钮 - 编辑模式时隐藏 */}
                                        {editingId !== dream.id && (
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => startEdit(dream)}
                                                    className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10"
                                                >
                                                    <Edit3 size={14} className="text-slate-400" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(dream.id)}
                                                    className="p-1.5 bg-white/5 rounded-lg hover:bg-red-500/20"
                                                >
                                                    <Trash2 size={14} className="text-slate-400" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* 添加弹窗 */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-end justify-center p-4"
                        onClick={() => setIsAdding(false)}
                    >
                        <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md bg-gradient-to-b from-violet-900 to-purple-900 rounded-t-[2rem] p-6 pb-10 border-t border-white/10"
                        >
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                <Sparkles size={20} className="text-fuchsia-300" />
                                添加新梦想
                            </h3>
                            <textarea
                                value={newDream}
                                onChange={(e) => setNewDream(e.target.value)}
                                placeholder="写下你想要实现的梦想..."
                                className="w-full bg-white/10 border border-white/10 rounded-2xl p-4 text-sm placeholder:text-slate-500 resize-none h-28"
                                autoFocus
                            />
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleAdd}
                                disabled={!newDream.trim()}
                                className="w-full mt-4 py-4 bg-fuchsia-500 rounded-2xl font-black text-lg shadow-lg shadow-fuchsia-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                许下心愿 ✨
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BucketList;
