import React from 'react';
import { Settings, Battery, Wifi, Gamepad2, Wind, Hammer, CloudRain, Flame, ToggleLeft, Cat, Bug, Trash2, ScrollText, Eraser, Zap, Bomb } from 'lucide-react';

// 主屏幕组件
// 显示所有应用图标和手机状态栏
const HomeScreen = ({ onOpenApp }) => {

    // 应用列表配置 - 使用生动的表情符号图标
    const apps = [
        // ============================================
        // 💡 提示：在这里添加你的新 App
        // 格式：{ id: '唯一ID', name: '显示名称', icon: '图标或emoji', color: '背景颜色类' },
        // ============================================


        // 第一批：基础玩具
        { id: 'ac', name: '电子空调', icon: <Wind size={28} className="text-white" />, color: 'bg-blue-400' },
        { id: 'fish', name: '赛博木鱼', icon: <Hammer size={28} className="text-white" />, color: 'bg-amber-600' },
        { id: 'bubble', name: '泡泡纸', icon: '🫧', color: 'bg-orange-400' },

        // 第一批：怪奇玩具
        { id: 'incense', name: '赛博烧香', icon: '🪔', color: 'bg-red-600' },
        { id: 'switch', name: '无用开关', icon: '🔘', color: 'bg-gray-600' },
        { id: 'purr', name: '哈基米', icon: '🐱', color: 'bg-yellow-400' },
        { id: 'mosquito', name: '打蚊子', icon: '🦟', color: 'bg-green-700' },

        // 第二批：离谱脑洞
        { id: 'flush', name: '情绪马桶', icon: '🚽', color: 'bg-cyan-500' },
        { id: 'stick', name: '赛博求签', icon: '🎋', color: 'bg-indigo-500' },
        { id: 'fog', name: '擦玻璃', icon: '🪟', color: 'bg-slate-500' },
        { id: 'crank', name: '手摇发电', icon: '⚡', color: 'bg-lime-600' },
        { id: 'bomb', name: '拆弹专家', icon: '💣', color: 'bg-red-800' },

        // Phase 4
        { id: 'cultivation', name: '赛博修仙', icon: '🧘', color: 'bg-slate-700' },
        { id: 'safe', name: '听风者', icon: '🔐', color: 'bg-neutral-800' },
        { id: 'sand', name: '指尖流沙', icon: '⏳', color: 'bg-cyan-900' },

        // Phase 5 - 新增4款
        { id: 'maze', name: '引力迷宫', icon: '🔮', color: 'bg-indigo-600' },
        { id: 'pixel', name: '像素画板', icon: '🎨', color: 'bg-pink-600' },
        { id: 'wheel', name: '命运转盘', icon: '🎰', color: 'bg-amber-600' },
        { id: 'mood', name: '情绪日记', icon: '📔', color: 'bg-teal-600' },

        // Phase 5 Extra - 新增
        { id: 'soundboard', name: '热门梗图', icon: '📢', color: 'bg-purple-600' }, // 添加了这一行
    ];

    return (
        <div className="w-full h-full bg-cover bg-center relative" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070)' }}>

            {/* 顶部状态栏 */}
            <div className="h-7 w-full flex items-center justify-between px-6 pt-2 text-white text-xs font-bold z-10 relative">
                <span>9:41</span>
                <div className="flex gap-2">
                    <Wifi size={14} />
                    <Battery size={14} />
                </div>
            </div>

            {/* 应用图标网格 - 调整为更密集的布局 */}
            <div className="grid grid-cols-4 gap-y-6 gap-x-2 p-4 pt-10 content-start overflow-y-auto h-[650px] scrollbar-hide">
                {apps.map(app => (
                    <div key={app.id} className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => onOpenApp(app.id)}
                            className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform`}
                        >
                            {app.icon}
                        </button>
                        <span className="text-white text-[10px] drop-shadow-md font-medium text-center leading-tight w-16">{app.name}</span>
                    </div>
                ))}
            </div>

            {/* 底部 Dock 栏 (装饰用) */}
            <div className="absolute bottom-4 left-4 right-4 h-20 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-around px-2">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg"><Settings size={24} className="text-white" /></div>
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg"><CloudRain size={24} className="text-white" /></div>
                <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg"><Gamepad2 size={24} className="text-white" /></div>
            </div>
        </div>
    );
};

export default HomeScreen;
