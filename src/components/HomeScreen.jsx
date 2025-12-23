import { Settings, Battery, Wifi, Gamepad2, Wind, Hammer, CloudRain, Flame, ToggleLeft, Cat, Bug, Trash2, ScrollText, Eraser, Zap, Bomb, Camera, Heart, Image as ImageIcon } from 'lucide-react';
import { playSound } from '../utils/audio';
import React from 'react';

// 主屏幕组件
const HomeScreen = ({ onOpenApp, settings, systemTemp }) => {
    const {
        wallpaper,
        appIconStyle: iconStyle = 'default',
        appGrid = '4x4',
        carrierName = 'Antigravity ✨',
        batteryStyle = 'default'
    } = settings;

    // 🚀 图标渲染引擎
    const renderIcon = (app) => {
        const sizeClass = appGrid === '5x5' ? "w-12 h-12" : "w-14 h-14";
        const baseClass = `${sizeClass} flex items-center justify-center transition-all duration-300 active:scale-95 select-none`;
        const iconSize = appGrid === '5x5' ? 24 : 28;

        const contents = (
            <div className={iconStyle === 'neon' ? "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : ""}>
                {React.isValidElement(app.icon) ? React.cloneElement(app.icon, { size: iconSize, className: "text-white" }) : app.icon}
            </div>
        );

        if (iconStyle === 'neon') {
            return (
                <button onClick={() => onOpenApp(app.id)} className={`${baseClass} ${app.color} rounded-[1.25rem] shadow-[0_8px_20px_rgba(0,0,0,0.3),inset_0_2px_4px_rgba(255,255,255,0.3)] border-b-4 border-black/20`}>
                    {contents}
                </button>
            );
        }

        if (iconStyle === 'flat') {
            return (
                <button onClick={() => onOpenApp(app.id)} className={`${baseClass} ${app.color} rounded-full border-2 border-white/10`}>
                    {contents}
                </button>
            );
        }

        return (
            <button onClick={() => onOpenApp(app.id)} className={`${baseClass} ${app.color} rounded-2xl shadow-lg border-t border-white/10`}>
                {contents}
            </button>
        );
    };

    // 应用列表配置
    const apps = [
        { id: 'ac', name: '电子空调', icon: <Wind />, color: 'bg-blue-400' },
        { id: 'fish', name: '赛博木鱼', icon: <Hammer />, color: 'bg-amber-600' },
        { id: 'bubble', name: '泡泡纸', icon: <span className="text-2xl">🫧</span>, color: 'bg-orange-400' },
        { id: 'incense', name: '赛博烧香', icon: <span className="text-2xl">🪔</span>, color: 'bg-red-600' },
        { id: 'switch', name: '无用开关', icon: <span className="text-2xl">🔘</span>, color: 'bg-gray-600' },
        { id: 'purr', name: '哈基米', icon: <span className="text-2xl">🐱</span>, color: 'bg-yellow-400' },
        { id: 'mosquito', name: '打蚊子', icon: <span className="text-2xl">🦟</span>, color: 'bg-green-700' },
        { id: 'flush', name: '情绪马桶', icon: <span className="text-2xl">🚽</span>, color: 'bg-cyan-500' },
        { id: 'stick', name: '赛博求签', icon: <span className="text-2xl">🎋</span>, color: 'bg-indigo-500' },
        { id: 'fog', name: '擦玻璃', icon: <span className="text-2xl">🪟</span>, color: 'bg-slate-500' },
        { id: 'crank', name: '手摇发电', icon: <Zap />, color: 'bg-lime-600' },
        { id: 'bomb', name: '拆弹专家', icon: <Bomb />, color: 'bg-red-800' },
        { id: 'cultivation', name: '赛博修仙', icon: <span className="text-2xl">🧘</span>, color: 'bg-slate-700' },
        { id: 'safe', name: '听风者', icon: <span className="text-2xl">🔐</span>, color: 'bg-neutral-800' },
        { id: 'sand', name: '指尖流沙', icon: <ScrollText />, color: 'bg-cyan-900' },
        { id: 'maze', name: '引力迷宫', icon: <span className="text-2xl">🔮</span>, color: 'bg-indigo-600' },
        { id: 'pixel', name: '像素画板', icon: <span className="text-2xl">🎨</span>, color: 'bg-pink-600' },
        { id: 'wheel', name: '命运转盘', icon: <span className="text-2xl">🎰</span>, color: 'bg-amber-600' },
        { id: 'mood', name: '情绪日记', icon: <span className="text-2xl">📔</span>, color: 'bg-teal-600' },
        { id: 'soundboard', name: '热梗音频', icon: <span className="text-2xl">📢</span>, color: 'bg-purple-600' },
        { id: 'lifecounter', name: '生命计时', icon: <span className="text-2xl">⏳</span>, color: 'bg-sky-600' },
        { id: 'bucketlist', name: '梦想清单', icon: <span className="text-2xl">🚀</span>, color: 'bg-fuchsia-600' },
        { id: 'anniversary', name: '时光轴', icon: <span className="text-2xl">📅</span>, color: 'bg-rose-500' },
    ];

    return (
        <div
            className="w-full h-full bg-cover bg-center relative flex flex-col no-scrollbar"
            style={{ backgroundImage: `url(${wallpaper || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070'})` }}
        >
            {/* 🚀 状态栏已移动至 App.jsx 作为全局组件 */}

            {/* 应用图标网格 */}
            <div className="flex-1 overflow-y-auto p-4 pt-10 scrollbar-hide no-scrollbar">
                <div className={`grid ${appGrid === '5x5' ? 'grid-cols-5 gap-y-5 gap-x-1' : 'grid-cols-4 gap-y-6 gap-x-2'} content-start pb-24`}>
                    {apps.map(app => (
                        <div key={app.id} className="flex flex-col items-center gap-1.5">
                            {renderIcon(app)}
                            <span className={`text-white drop-shadow-md font-bold text-center leading-tight opacity-90 truncate ${appGrid === '5x5' ? 'text-[8px] w-14' : 'text-[9px] w-16'}`}>
                                {app.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 底部 Dock 栏 */}
            <div className="absolute bottom-6 left-4 right-4 h-20 bg-black/40 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-around px-2 z-10 shrink-0 border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <button
                    onClick={() => { playSound('1.mp3'); onOpenApp('settings'); }}
                    className="group relative w-12 h-12 bg-gradient-to-tr from-emerald-600 to-green-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)] active:scale-90 transition-all duration-300"
                >
                    <Settings size={22} className="text-white group-hover:rotate-90 transition-transform duration-500" />
                </button>
                <button
                    onClick={() => { playSound('1.mp3'); onOpenApp('camera'); }}
                    className="group relative w-12 h-12 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(56,189,248,0.3)] active:scale-90 transition-all duration-300"
                >
                    <Camera size={22} className="text-white" />
                </button>
                <button
                    onClick={() => { playSound('1.mp3'); onOpenApp('gallery'); }}
                    className="group relative w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] active:scale-90 transition-all duration-300"
                >
                    <ImageIcon size={22} className="text-white" />
                </button>
                <button
                    onClick={() => { playSound('1.mp3'); onOpenApp('support'); }}
                    className="group relative w-12 h-12 bg-gradient-to-tr from-rose-600 to-pink-400 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(251,113,133,0.3)] active:scale-90 transition-transform duration-300"
                >
                    <Heart size={22} className="text-white group-hover:scale-110 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export default HomeScreen;
