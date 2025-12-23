import React, { useState } from 'react';
import { ArrowLeft, Coffee, Heart, Share2, Sparkles, Star, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

/**
 * 作者打赏软件 (SupportAuthor)
 * 🚀 极致打磨版本：丝滑弹窗、随机趣味文案
 */
const SupportAuthor = ({ onClose }) => {

    // 当前激活的支付方式
    const [activePayment, setActivePayment] = useState('wechat');
    // 弹窗状态
    const [popup, setPopup] = useState({ show: false, type: '', message: '', emoji: '' });

    // ☕ 咖啡文案库
    const coffeeMessages = [
        { text: '咖啡因已充能！', emoji: '☕', sub: '熬夜加班的动力来源' },
        { text: '一杯美式，谢谢老板！', emoji: '🥤', sub: '苦涩中带着一丝甜' },
        { text: '这杯续命水我收下了', emoji: '💧', sub: '程序员标配' },
        { text: '咖啡豆感受到了你的温暖', emoji: '🫘', sub: '正在萃取灵感...' },
        { text: '双倍浓缩已注入血管', emoji: '💉', sub: '代码效率 +200%' },
        { text: '拿铁在手，bug全走', emoji: '🧋', sub: '玄学护体' },
        { text: '感谢投喂！', emoji: '😽', sub: '作者露出满足的微笑' },
        { text: '这杯我敬你', emoji: '🍻', sub: '干杯！' },
    ];

    // ⚡ 发电文案库
    const zapMessages = [
        { text: '赛博能量已接收！', emoji: '⚡', sub: '电力全开' },
        { text: '叮！充电完成', emoji: '🔋', sub: '满血复活' },
        { text: '能量条 +99999', emoji: '💪', sub: '肝帝模式启动' },
        { text: '爱的电流穿过了我', emoji: '💕', sub: '触电的感觉真好' },
        { text: '感谢发电！光芒万丈', emoji: '🌟', sub: '照亮我的代码之路' },
        { text: '核聚变启动成功', emoji: '☢️', sub: '无限续航' },
        { text: '太阳能板已对准你', emoji: '🌞', sub: '感谢阳光' },
        { text: '爱的能量已存储', emoji: '🔮', sub: '下次更新见' },
    ];

    // 显示精美弹窗
    const showPopup = (type) => {
        playSound('1.mp3');
        const messages = type === 'coffee' ? coffeeMessages : zapMessages;
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        setPopup({
            show: true,
            type,
            message: randomMsg.text,
            emoji: randomMsg.emoji,
            sub: randomMsg.sub
        });
    };

    // 关闭弹窗
    const closePopup = () => {
        setPopup({ ...popup, show: false });
    };

    // 支付方式数据
    const paymentMethods = [
        { id: 'wechat', name: '微信支付', nameEn: 'WeChat Pay', color: 'emerald', img: '/images/wei_pay.jpg' },
        { id: 'alipay', name: '支付宝', nameEn: 'AliPay', color: 'blue', img: '/images/zhi_pay.jpg' },
    ];

    // 容器动画变体
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 15 } }
    };

    return (
        <div className="h-full bg-zinc-950 flex flex-col text-white overflow-hidden relative">

            {/* 动态背景 */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -150, 0],
                            x: [0, Math.sin(i) * 30, 0],
                            opacity: [0.1, 0.3, 0.1],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{
                            duration: 6 + i * 0.8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.3
                        }}
                        className={`absolute rounded-full blur-3xl ${i % 2 === 0 ? 'bg-rose-600/15' : 'bg-pink-500/10'}`}
                        style={{
                            width: 80 + i * 40,
                            height: 80 + i * 40,
                            left: `${10 + (i * 12)}%`,
                            top: `${20 + Math.sin(i) * 30}%`,
                        }}
                    />
                ))}
            </div>

            {/* 顶部导航栏 */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 20, delay: 0.1 }}
                className="pt-10 pb-5 px-5 flex items-center gap-4 bg-zinc-900/50 backdrop-blur-2xl border-b border-white/5 z-20"
            >
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-all border border-white/5"
                >
                    <ArrowLeft size={24} />
                </motion.button>
                <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-rose-400 animate-pulse" />
                    <h1 className="text-xl font-black italic tracking-tighter">充能中心</h1>
                </div>
            </motion.div>

            {/* 内容区域 */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center z-10 no-scrollbar"
            >

                {/* 作者头像 */}
                <motion.div variants={itemVariants} className="relative w-24 h-24 mb-6">
                    <motion.div
                        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute inset-[-20px] bg-rose-500 blur-3xl rounded-full"
                    />
                    <motion.div
                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                        className="relative w-full h-full bg-gradient-to-br from-rose-600 via-pink-500 to-rose-400 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-2 border-white/20"
                    >
                        <Heart size={40} className="text-white fill-white/40" />
                    </motion.div>
                </motion.div>

                <motion.h2 variants={itemVariants} className="text-2xl font-black mb-2 tracking-tight">
                    感谢您的陪伴
                </motion.h2>
                <motion.p variants={itemVariants} className="text-[10px] text-zinc-400 text-center mb-8 leading-relaxed font-bold uppercase tracking-widest px-4">
                    如果您觉得这个赛博玩具箱给您带来了一丝快乐，<br />
                    欢迎支持一下作者，您的鼓励是我持续更新的最大动力！✨
                </motion.p>

                {/* 支付方式切换器 */}
                <motion.div variants={itemVariants} className="flex gap-2 mb-6 bg-white/5 rounded-2xl p-1 border border-white/5">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => { setActivePayment(method.id); playSound('1.mp3'); }}
                            className={`relative px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${activePayment === method.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {activePayment === method.id && (
                                <motion.div
                                    layoutId="activePaymentBg"
                                    className={`absolute inset-0 rounded-xl ${method.color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'}`}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{method.name}</span>
                        </button>
                    ))}
                </motion.div>

                {/* 二维码展示区 */}
                <motion.div variants={itemVariants} className="w-full max-w-xs">
                    <AnimatePresence mode="wait">
                        {paymentMethods.filter(m => m.id === activePayment).map((method) => (
                            <motion.div
                                key={method.id}
                                initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
                                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                                exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 flex flex-col items-center border border-white/10 shadow-2xl"
                            >
                                <div className={`w-full aspect-square bg-white rounded-2xl flex items-center justify-center mb-4 overflow-hidden border-4 ${method.color === 'emerald' ? 'border-emerald-500/30' : 'border-blue-500/30'} shadow-inner`}>
                                    <img
                                        src={method.img}
                                        alt={`${method.name}二维码`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            const container = e.target.parentNode;
                                            if (container) {
                                                container.innerHTML = `<span class="text-zinc-400 text-[10px] font-black uppercase text-center px-4 tracking-widest">${method.name}二维码加载失败<br/>建议在电脑端查看</span>`;
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star size={12} className={method.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'} />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${method.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'}`}>
                                        {method.nameEn}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* 底部互动按钮 */}
                <motion.div variants={itemVariants} className="mt-10 flex gap-3 w-full px-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => showPopup('coffee')}
                        className="flex-1 bg-white/5 hover:bg-white/10 h-14 rounded-2xl flex items-center justify-center gap-3 transition-all border border-white/10 group shadow-lg"
                    >
                        <Coffee size={20} className="group-hover:rotate-12 transition-transform text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">请喝咖啡</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: '0 15px 30px rgba(225,29,72,0.5)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => showPopup('zap')}
                        className="w-14 h-14 bg-gradient-to-br from-rose-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(225,29,72,0.4)] transition-all"
                    >
                        <Zap size={22} className="text-white" />
                    </motion.button>
                </motion.div>

                <motion.p variants={itemVariants} className="mt-14 text-[8px] text-zinc-600 font-black pb-8 uppercase tracking-[.4em]">
                    Ver 1.5.0 • 为爱发电 (Passion Driven)
                </motion.p>
            </motion.div>

            {/* ========== 精美弹窗 ========== */}
            <AnimatePresence>
                {popup.show && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-8"
                        onClick={closePopup}
                    >
                        {/* 背景遮罩 + 模糊 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        />

                        {/* 弹窗卡片 */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.7, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -30 }}
                            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full max-w-xs rounded-[2rem] p-8 text-center shadow-2xl overflow-hidden ${popup.type === 'coffee'
                                ? 'bg-gradient-to-br from-amber-600 via-orange-500 to-amber-400'
                                : 'bg-gradient-to-br from-rose-600 via-pink-500 to-fuchsia-400'
                                }`}
                        >
                            {/* 装饰光晕 */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-white/20 blur-3xl rounded-full -translate-y-1/2" />

                            {/* 关闭按钮 */}
                            <button
                                onClick={closePopup}
                                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X size={16} className="text-white/70" />
                            </button>

                            {/* Emoji */}
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', delay: 0.1, damping: 10 }}
                                className="text-6xl mb-4"
                            >
                                {popup.emoji}
                            </motion.div>

                            {/* 主文案 */}
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="text-xl font-black text-white mb-2"
                            >
                                {popup.message}
                            </motion.h3>

                            {/* 副文案 */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25 }}
                                className="text-xs text-white/70 font-bold"
                            >
                                {popup.sub}
                            </motion.p>

                            {/* 底部装饰粒子 */}
                            <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: -20, opacity: [0, 1, 0] }}
                                        transition={{
                                            duration: 1.5,
                                            delay: 0.3 + i * 0.15,
                                            repeat: Infinity,
                                            repeatDelay: 2
                                        }}
                                        className="absolute w-2 h-2 bg-white/40 rounded-full"
                                        style={{ left: `${15 + i * 18}%` }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default SupportAuthor;
