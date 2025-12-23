import React, { useState } from 'react';
import { ArrowLeft, Monitor, Smartphone, Palette, Info, Check, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound } from '../../utils/audio';

/**
 * 系统设置 (SystemSettings)
 * 用于配置壁纸、灵动岛样式、图标等全局显示选项。
 */
const SystemSettings = ({ onClose, settings, updateSetting, systemTemp }) => {

    // 默认壁纸列表
    const DEFAULT_WALLPAPERS = [
        { id: 'wp1', name: '流光幻彩', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000' },
        { id: 'wp2', name: '深邃星空', url: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?q=80&w=1000' },
        { id: 'wp3', name: '午后阳光', url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=1000' },
        { id: 'wp4', name: '赛博霓虹', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1000' },
        { id: 'wp5', name: '纯净白昼', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000' },
    ];

    // 切换设置的处理函数
    const handleSet = (key, value) => {
        playSound('1.mp3');
        updateSetting(key, value);
    };

    return (
        <div className="h-full bg-slate-50 flex flex-col text-slate-900 overflow-hidden">
            {/* --- 顶部导航栏 --- */}
            <div className="pt-10 pb-5 px-5 flex items-center gap-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm z-10">
                <button
                    onClick={onClose}
                    className="p-2.5 bg-slate-100 rounded-full hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
                >
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black tracking-tighter italic text-slate-800 uppercase leading-none">System Config</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-400">核心温度: {systemTemp.toFixed(1)}°C 正常运行中</span>
                    </div>
                </div>
            </div>

            {/* --- 内容区域 --- */}
            <div className="flex-1 overflow-y-auto p-6 pb-20 space-y-10">

                {/* 1. 壁纸中心 */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Monitor size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">壁纸中心 Wallpaper</span>
                    </div>

                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 -mx-2 px-2">
                        {DEFAULT_WALLPAPERS.map((wp) => (
                            <button
                                key={wp.id}
                                onClick={() => handleSet('wallpaper', wp.url)}
                                className={`group relative flex-shrink-0 w-32 aspect-[9/16] rounded-2xl overflow-hidden shadow-md transition-all duration-500 ${settings.wallpaper === wp.url ? 'ring-4 ring-indigo-500/30 scale-95 shadow-xl' : 'hover:shadow-lg'}`}
                            >
                                <img src={wp.url} alt={wp.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                <div className="absolute bottom-3 left-3 right-3 text-[9px] font-black uppercase tracking-widest text-white/90 truncate">
                                    {wp.name}
                                </div>
                                {settings.wallpaper === wp.url && (
                                    <div className="absolute top-3 right-3 bg-indigo-500 rounded-full p-1 shadow-lg scale-110">
                                        <Check size={12} className="text-white font-bold" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. 状态栏与状态定制 ( carrierName, batteryStyle ) */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-200">
                            <Smartphone size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">状态栏个性化 Status Bar</span>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-5 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">你的名称/幸运数字等</label>
                            <input
                                type="text"
                                value={settings.carrierName}
                                onChange={(e) => updateSetting('carrierName', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all"
                                placeholder="输入您的名称/幸运数字等..."
                            />
                        </div>

                        <div className="h-px bg-slate-50" />

                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-black text-slate-700">电池图标风格</span>
                                <span className="text-[10px] text-slate-400">切换 Emoji 极简风格</span>
                            </div>
                            <button
                                onClick={() => handleSet('batteryStyle', settings.batteryStyle === 'emoji' ? 'default' : 'emoji')}
                                className={`w-14 h-7 rounded-full flex items-center px-1 transition-all ${settings.batteryStyle === 'emoji' ? 'bg-emerald-500 shadow-md shadow-emerald-200' : 'bg-slate-300'}`}
                            >
                                <motion.div animate={{ x: settings.batteryStyle === 'emoji' ? 28 : 0 }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* 3. 音效与字体 ( audioPackage, fontFamily ) */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                            <Palette size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">多媒体与排版 Audio & Type</span>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-6 shadow-sm">
                        {/* 字体风格 */}
                        <div className="space-y-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">系统字体风格 Typography</span>
                            <div className="flex gap-2">
                                {[
                                    { id: 'sans', name: '无衬线', font: 'font-sans' },
                                    { id: 'pixel', name: '像素风格', font: 'font-mono' },
                                    { id: 'serif', name: '古典衬线', font: 'font-serif' }
                                ].map(font => (
                                    <button
                                        key={font.id}
                                        onClick={() => handleSet('fontFamily', font.id)}
                                        className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${settings.fontFamily === font.id ? 'bg-slate-800 border-slate-800 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                                    >
                                        <span className={`text-xs font-bold ${font.font}`}>Aa</span>
                                        <span className="text-[10px] font-bold">{font.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. 界面布局与图标 ( appGrid, appIconStyle ) */}
                <section className="relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Layers size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">桌面布局定制 Grid & Style</span>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-6 shadow-sm">
                        {/* 网格密度 */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-black text-slate-700">图标排列密度</span>
                                <span className="text-[10px] text-slate-400">切换 4x4 或 5x5 视图</span>
                            </div>
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                {['4x4', '5x5'].map(grid => (
                                    <button
                                        key={grid}
                                        onClick={() => handleSet('appGrid', grid)}
                                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${settings.appGrid === grid ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {grid}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-50" />

                        {/* 图标渲染方案 */}
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'default', name: '经典 Android', desc: '圆角矩形，纯粹干净', color: 'bg-slate-200' },
                                { id: 'flat', name: '极简圆环', desc: '超扁平化，无阴影设计', color: 'bg-emerald-400' },
                                { id: 'neon', name: '拟物霓虹', desc: '带外发光的高级质感', color: 'bg-gradient-to-tr from-rose-600 to-pink-400' }
                            ].map(style => (
                                <button
                                    key={style.id}
                                    onClick={() => handleSet('appIconStyle', style.id)}
                                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${settings.appIconStyle === style.id ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${style.color}`}>Icon</div>
                                    <div className="flex flex-col items-start text-left">
                                        <span className="text-sm font-black text-slate-700">{style.name}</span>
                                        <span className="text-[10px] text-slate-400">{style.desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 2. 灵动岛与宠物 */}
                <section>
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                            <Smartphone size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">外观 & 交互 Interface</span>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-6">
                        {/* 样式选择 */}
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">灵动岛样式 Notch Style</span>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'classic', name: '经典黑' },
                                    { id: 'wide', name: '宽幅' },
                                    { id: 'dot', name: '极简点' },
                                    { id: 'glow', name: '霓虹光' },
                                    { id: 'hidden', name: '隐藏' }
                                ].map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => handleSet('notchStyle', style.id)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${settings.notchStyle === style.id
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-inner'
                                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span className="text-xs font-bold mb-1">{style.name}</span>
                                        {settings.notchStyle === style.id && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        {/* 宠物选择 */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">桌面宠物 Pixels</span>

                                {/* 宠物色彩开关 */}
                                {settings.petMode !== 'none' && (
                                    <button
                                        onClick={() => handleSet('petStyle', settings.petStyle === 'silhouette' ? 'color' : 'silhouette')}
                                        className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 active:scale-95 transition-all"
                                    >
                                        <div className={`w-2 h-2 rounded-full ${settings.petStyle === 'color' ? 'bg-indigo-500' : 'bg-black'}`} />
                                        <span className="text-[10px] font-bold text-slate-600">
                                            {settings.petStyle === 'color' ? '彩色模式' : '剪影模式'}
                                        </span>
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                                {[
                                    { id: 'dragon', icon: '🐉', name: '青龙' },
                                    { id: 'tiger', icon: '🐅', name: '白虎' },
                                    { id: 'bird', icon: '🐦', name: '朱雀' },
                                    { id: 'tortoise', icon: '🐢', name: '玄武' },
                                    { id: 'none', icon: '🚫', name: '关闭' }
                                ].map((pet) => (
                                    <button
                                        key={pet.id}
                                        onClick={() => handleSet('petMode', pet.id)}
                                        className={`flex-shrink-0 px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${settings.petMode === pet.id
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm scale-105'
                                            : 'bg-slate-50 border-slate-100 text-slate-500'
                                            }`}
                                    >
                                        <span className="text-sm">{pet.icon}</span>
                                        <span className="text-xs font-bold">{pet.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. 底部系统信息 */}
                <div className="mt-12 flex flex-col items-center gap-4 pb-10">
                    <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-4 py-2 rounded-full border border-slate-200">
                        <Info size={14} />
                        <span className="text-[9px] uppercase font-black tracking-[.4em]">核心系统 v4.1.2个性化版</span>
                    </div>
                    <p className="text-[8px] text-slate-300 font-bold max-w-[200px] text-center leading-relaxed">
                        您的点击行为正在产生虚假的系统温度波动。这是一个完全符合解压审美的闭环系统。
                    </p>
                </div>
            </div>
        </div>
    );
};


export default SystemSettings;
