import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapacitorApp } from '@capacitor/app';
import { Settings, Battery, Wifi, WifiOff, Signal, Gamepad2, Wind, Hammer, CloudRain, Flame, ToggleLeft, Cat, Bug, Trash2, ScrollText, Eraser, Zap, Bomb, Camera, Heart, Image as ImageIcon, Dog, Rabbit, Bird } from 'lucide-react';
import HomeScreen from './components/HomeScreen';
import { stopAllSounds, playSound } from './utils/audio';

// 导入所有应用组件
import VirtualAC from './components/apps/VirtualAC';
import WoodenFish from './components/apps/WoodenFish';
import BubbleWrap from './components/apps/BubbleWrap';
import CyberIncense from './components/apps/CyberIncense';
import UselessSwitch from './components/apps/UselessSwitch';
import PurrTherapy from './components/apps/PurrTherapy';
import MosquitoHunter from './components/apps/MosquitoHunter';

// Phase 2 Apps
import EmotionFlush from './components/apps/EmotionFlush';
import CyberDivination from './components/apps/CyberDivination';
import FoggyWindow from './components/apps/FoggyWindow';
import HandCrank from './components/apps/HandCrank';
import BombDefuser from './components/apps/BombDefuser';
import DigitalCultivation from './components/apps/DigitalCultivation';
import TheSafe from './components/apps/TheSafe';
import SandArt from './components/apps/SandArt';

// Phase 5 Apps - 新增4款
import GravityMaze from './components/apps/GravityMaze';
import PixelCanvas from './components/apps/PixelCanvas';
import WheelOfFortune from './components/apps/WheelOfFortune';
import MoodJournal from './components/apps/MoodJournal';

// ==========================================
// 步骤 1: 在这里导入你的新应用组件
// ==========================================
// 新增扩展应用
import SoundBoard from './components/apps/SoundBoard';
import SystemSettings from './components/apps/SystemSettings';
import RetroCamera from './components/apps/RetroCamera';
import SupportAuthor from './components/apps/SupportAuthor';
import PhotoGallery from './components/apps/PhotoGallery';

// 新增有意义的应用
import LifeCounter from './components/apps/LifeCounter';
import BucketList from './components/apps/BucketList';
import Anniversary from './components/apps/Anniversary';



// 🚀 导入像素引擎
import PixelPet from './components/PixelPet';

// 🐾 桌面宠物 (Desktop Pet) - 独立可交互组件
const DesktopPet = ({ settings }) => {
    if (settings.petMode === 'none') return null;

    const [petState, setPetState] = useState({ action: 'idle' });
    const [frame, setFrame] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 }); // 逻辑位置
    const [direction, setDirection] = useState(1); // 1: Right, -1: Left

    // 🧠 核心 AI 行为循环
    useEffect(() => {
        let isWalking = false;
        let walkTarget = 0;
        let walkInterval = null;

        // 1. 决策循环 Behavior Loop
        const decisionTimer = setInterval(() => {
            if (isWalking) return; // 正在走路时不打断

            const rand = Math.random();
            const currentHour = new Date().getHours();
            const isNight = currentHour > 22 || currentHour < 6;

            let nextAction = 'idle';
            let duration = 2000;

            // 权重决策
            if (isNight && rand < 0.3) {
                nextAction = 'sleep';
                duration = 8000; // 晚上容易睡着
            } else if (rand < 0.3) {
                nextAction = 'idle';
                duration = 3000;
            } else if (rand < 0.5) {
                nextAction = 'blink';
                duration = 200;
            } else if (rand < 0.8) {
                // 启动游走
                nextAction = 'walk';
                isWalking = true;

                // 随机决定去哪里 (-120px 到 +120px 范围)
                walkTarget = (Math.random() - 0.5) * 200;
                setDirection(walkTarget > position.x ? 1 : -1);

                // 启动走路定时器
                walkInterval = setInterval(() => {
                    setPosition(prev => {
                        const dist = walkTarget - prev.x;
                        if (Math.abs(dist) < 5) {
                            // 到达目的地
                            clearInterval(walkInterval);
                            isWalking = false;
                            setPetState({ action: 'idle' });
                            return prev;
                        }
                        // 移动速度
                        return { x: prev.x + (dist > 0 ? 2 : -2), y: 0 };
                    });
                }, 50); // 每50ms走一步

                setPetState({ action: 'walk' });
                return; // 这里的 return 是跳过下面的 setState，交由 walkInterval 控制结束
            } else {
                nextAction = 'excited';
                duration = 1500;
            }

            setPetState({ action: nextAction });
            if (nextAction !== 'walk' && nextAction !== 'idle') {
                setTimeout(() => setPetState({ action: 'idle' }), duration);
            }

        }, 4000); // 每4秒做一次决策

        // 2. 动画帧循环 (用于驱动走路/眨眼的多帧细节)
        const frameTimer = setInterval(() => {
            setFrame(f => (f + 1) % 2);
        }, 250);

        return () => {
            clearInterval(decisionTimer);
            clearInterval(frameTimer);
            if (walkInterval) clearInterval(walkInterval);
        };
    }, []); // Empty deps to run once, keeping state in refs/closues if needed, but here simple state is fine

    const getCurrentPixelAction = () => {
        if (petState.action === 'walk') {
            return frame === 0 ? 'walk1' : 'walk2';
        }
        return petState.action;
    };

    return (
        <motion.div
            drag
            dragMomentum={false}
            // 绑定逻辑位置到 x 轴动画，但允许用户拖拽 (使用 dragListener=false 如果需要完全程序控制，这里混合模式)
            animate={{
                x: position.x,
                rotateY: direction === -1 ? 180 : 0 // CSS flip via Framer Motion
            }}
            transition={{ type: 'spring', stiffness: 50 }} // 平滑移动

            whileDrag={{ scale: 1.2, cursor: 'grabbing' }}
            whileTap={{ scale: 0.9 }}

            className="absolute bottom-24 right-1/4 z-[200] cursor-grab touch-none"
            onClick={() => {
                setPetState({ action: 'excited' });
                playSound('ac_beep.mp3');
                setTimeout(() => setPetState({ action: 'idle' }), 1500);
            }}
        >
            <PixelPet
                mode={settings.petMode}
                action={getCurrentPixelAction()}
                style={settings.petStyle}
            />

            <AnimatePresence>
                {petState.action === 'excited' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, rotateY: direction === -1 ? 180 : 0 }}
                        animate={{ opacity: [0, 1, 0], y: -40 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-rose-500 pointer-events-none"
                    >
                        <Heart size={20} fill="currentColor" />
                    </motion.div>
                )}
                {petState.action === 'sleep' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-4 right-0 text-slate-400 text-xs font-bold animate-pulse pointer-events-none"
                    >
                        zZ
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};


function App() {
    // 1. 系统全局设置：优先声明，因为后续 Effect 可能依赖它 (防止 TDZ 错误)
    const [settings, setSettings] = useState(() => {
        const defaults = {
            wallpaper: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070',
            notchStyle: 'classic',
            petMode: 'none',
            petStyle: 'color',
            appIconStyle: 'neon',
            carrierName: 'Antigravity ✨',
            appGrid: '4x4',
            fontFamily: 'sans',
            batteryStyle: 'default',
        };
        try {
            const saved = localStorage.getItem('system_settings');
            const parsed = saved ? JSON.parse(saved) : {};
            return { ...defaults, ...parsed };
        } catch (e) {
            return defaults;
        }
    });

    // 2. 核心状态：当前打开的应用
    const [currentApp, setCurrentApp] = useState(null);

    // 🚀 系统“体温”逻辑 (模拟)
    const [systemTemp, setSystemTemp] = useState(36.5);
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemTemp(prev => {
                const target = 36.5 + (Math.random() * 0.5);
                return prev + (target - prev) * 0.1;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // 🚀 全局数据聚合与滚动引擎
    const [currentTime, setCurrentTime] = useState("");
    const [statusScrollItem, setStatusScrollItem] = useState({ id: 'time', content: '载入中...' });
    const [marqueeActive, setMarqueeActive] = useState(false);
    const [networkStatus, setNetworkStatus] = useState({ type: 'wifi', label: 'WiFi' });
    const [batteryLevel, setBatteryLevel] = useState(100);
    const [lifeStats, setLifeStats] = useState(null);
    const statusContentRef = useRef(null);

    // 网络状态探测逻辑
    const updateNetworkStatus = useCallback(() => {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!navigator.onLine) {
            setNetworkStatus({ type: 'offline', label: '无网' });
            return;
        }
        if (conn) {
            const type = conn.type; // 'wifi', 'cellular', etc.
            const effectiveType = conn.effectiveType; // '4g', '3g', etc.
            if (type === 'wifi') setNetworkStatus({ type: 'wifi', label: 'WiFi' });
            else if (type === 'cellular') setNetworkStatus({ type: 'cellular', label: effectiveType ? effectiveType.toUpperCase() : '数据' });
            else setNetworkStatus({ type: 'online', label: '在线' });
        } else {
            setNetworkStatus({ type: 'wifi', label: 'WiFi' }); // 默认占位
        }
    }, []);

    // 生命数据计算逻辑 - 扩展全维度统计
    const calculateLifeStats = useCallback(() => {
        const birthday = localStorage.getItem('life_counter_birthday');
        if (!birthday) return null;
        const birth = new Date(birthday);
        const now = new Date();
        const diff = now.getTime() - birth.getTime();

        const totalSeconds = Math.floor(diff / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const totalDays = Math.floor(totalHours / 24);

        // 精确年月日
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let days = now.getDate() - birth.getDate();
        if (days < 0) { months--; const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0); days += lastMonth.getDate(); }
        if (months < 0) { years--; months += 12; }

        return {
            years, months, days,
            totalDays, totalHours, totalMinutes,
            heartbeats: totalMinutes * 70,
            breaths: totalMinutes * 15
        };
    }, []);

    // 聚合滚动内容
    const refreshRollingContent = useCallback(() => {
        const stats = calculateLifeStats();
        setLifeStats(stats);

        const quotes = [
            '保持热爱，奔赴山海 ✨',
            '每一个明天都是惊喜 🎁',
            '星光不问赶路人 🌟',
            '念念不忘，必有回响 🪐',
            '万物皆有裂痕，那是光照进来的地方 🕊️',
            '所有过往，皆为序章 📖',
            '山高路远，看世界也找自己 🏔️',
            '生活明朗，万物可爱 🌈',
            '追风赶月莫停留 🏃‍♂️',
            '心中有丘壑，眉目显山河 🏞️',
            '愿你眼里的星星永远明亮 ✨',
            '纵使疾风起，人生不言弃 🍃',
            '心之所向，无问西东 🧭',
            '不乱于心，不困于情 🕯️',
            '生活原本沉闷，但跑起来就有风 🏃‍♀️'
        ];

        const items = [
            ...quotes.map((q, i) => ({ id: `quote-${i}`, content: q, icon: '📝' }))
        ];

        if (stats) {
            items.push({ id: 'life-age', content: `已存活 ${stats.years}年${stats.months}月${stats.days}天`, icon: '🌱' });
            items.push({ id: 'life-days', content: `跨越了 ${stats.totalDays.toLocaleString()} 个昼夜`, icon: '⏳' });
            items.push({ id: 'life-hours', content: `累计见证 ${stats.totalHours.toLocaleString()} 小时`, icon: '🌙' });
            items.push({ id: 'life-mins', content: `走过 ${stats.totalMinutes.toLocaleString()} 分钟`, icon: '⏱️' });
            items.push({ id: 'life-heart', content: `心跳已累计 ${Math.floor(stats.heartbeats / 10000)}w+ 次`, icon: '❤️' });
            items.push({ id: 'life-breath', content: `呼吸已累计 ${Math.floor(stats.breaths / 10000)}w+ 次`, icon: '🌬️' });
        }

        // 梦想清单数据 - 增加权重
        try {
            const dreams = JSON.parse(localStorage.getItem('system_bucket_list') || '[]');
            const pending = dreams.filter(d => !d.completed);
            pending.forEach((d, i) => {
                items.push({ id: `dream-${i}`, content: `梦想：${d.title}`, icon: '🚀' });
            });
        } catch (e) { }

        // 纪念日数据 - 增加权重
        try {
            const anniversaries = JSON.parse(localStorage.getItem('system_anniversaries') || '[]');
            anniversaries.forEach((event, i) => {
                const target = new Date(event.date);
                const now = new Date();
                const d1 = new Date(target.getFullYear(), target.getMonth(), target.getDate());
                const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const diff = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
                const text = diff < 0 ? `距离 ${event.title} 还有 ${Math.abs(diff)} 天` : `${event.title} 已 ${diff} 天`;
                items.push({ id: `anniv-${i}`, content: text, icon: '📅' });
            });
        } catch (e) { }

        const randomItem = items[Math.floor(Math.random() * items.length)];
        setStatusScrollItem(randomItem);
    }, [currentTime, calculateLifeStats]);

    // 动态探测是否需要跑马灯
    useEffect(() => {
        if (statusContentRef.current) {
            const isOverflow = statusContentRef.current.offsetWidth > 160;
            setMarqueeActive(isOverflow);
        }
    }, [statusScrollItem]);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            setCurrentTime(timeStr);
        };
        updateTime();
        const timer = setInterval(updateTime, 30000); // 30秒校对一次

        // 状态栏随机滚动逻辑 (10秒翻转一次)
        const scrollTimer = setInterval(refreshRollingContent, 10000);
        refreshRollingContent();

        // 模拟电量缓慢下降
        const batTimer = setInterval(() => {
            setBatteryLevel(prev => Math.max(1, prev - 1));
        }, 120000);

        // 网络监听
        updateNetworkStatus();
        window.addEventListener('online', updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        const conn = navigator.connection;
        if (conn) conn.addEventListener('change', updateNetworkStatus);

        return () => {
            clearInterval(timer);
            clearInterval(scrollTimer);
            clearInterval(batTimer);
            window.removeEventListener('online', updateNetworkStatus);
            window.removeEventListener('offline', updateNetworkStatus);
            if (conn) conn.removeEventListener('change', updateNetworkStatus);
        };
    }, [refreshRollingContent, updateNetworkStatus]);

    // 监听持久化设置
    useEffect(() => {
        localStorage.setItem('system_settings', JSON.stringify(settings));
    }, [settings]);

    // 更新设置的通用方法
    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    // 应用操作方法
    const openApp = (appId) => setCurrentApp(appId);
    const closeApp = () => {
        stopAllSounds();
        setCurrentApp(null);
    };

    // 使用 Ref 追踪当前应用状态，用于底层硬件交互 (如 Android 返回键)
    const currentAppRef = React.useRef(currentApp);
    useEffect(() => { currentAppRef.current = currentApp; }, [currentApp]);

    // 监听物理返回键
    useEffect(() => {
        let backListener;
        const setupListener = async () => {
            backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                // 🚀 核心逻辑提升：分发自定义事件，允许应用拦截返回键
                const backEvent = new CustomEvent('appBackButtonPressed', {
                    cancelable: true,
                    detail: { canGoBack }
                });
                const wasCancelled = !window.dispatchEvent(backEvent);

                if (wasCancelled) {
                    console.log("Back button intercepted by app");
                    return; // 已经被拦截，不执行默认关闭逻辑
                }

                if (currentAppRef.current) {
                    stopAllSounds();
                    setCurrentApp(null);
                } else {
                    CapacitorApp.exitApp();
                }
            });
        };
        setupListener();
        return () => { if (backListener) backListener.remove(); };
    }, []);

    // 💡 灵动岛 (Notch) - 纯视觉
    const renderNotch = () => {
        const styles = {
            classic: "w-32 h-7 rounded-b-2xl",
            wide: "w-48 h-6 rounded-b-xl",
            dot: "w-6 h-6 rounded-full mt-1",
            glow: "w-32 h-7 rounded-b-2xl shadow-[0_0_15px_rgba(79,70,229,0.5)] border-b border-indigo-500/30",
            hidden: "w-10 h-1 opacity-20"
        };
        const currentStyle = styles[settings.notchStyle] || styles.classic;

        return (
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-black z-[100] flex justify-center items-center transition-all duration-500 ${currentStyle}`}>
                {settings.notchStyle !== 'dot' && <div className="w-16 h-4 bg-black rounded-full absolute" />}
            </div>
        );
    };
    // 🚀 全局状态栏渲染逻辑
    const renderStatusBar = () => {
        return (
            <div className="absolute top-0 left-0 w-full h-8 flex items-center justify-between px-6 z-[200] text-white pt-1.5 pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                {/* 左侧：固定时间 + 个性化内容 (限长防止重叠) */}
                <div className="flex items-center gap-1 text-[10px] font-black tracking-tighter min-w-[40px] flex-shrink-0">
                    <span className="flex-shrink-0 leading-none">{currentTime}</span>
                    {settings.carrierName && (
                        <>
                            <span className="opacity-30 font-thin flex-shrink-0 leading-none">|</span>
                            <span className="opacity-90 truncate max-w-[48px] leading-none">
                                {settings.carrierName.slice(0, 5)}
                            </span>
                        </>
                    )}
                </div>

                {/* ✨ 正中心：滚动播报 */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 h-8 flex items-center justify-center max-w-[60%]">
                    <div className="h-full flex items-center overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={statusScrollItem.id + statusScrollItem.content}
                                initial={{ y: 8, filter: 'blur(4px)', opacity: 0 }}
                                animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
                                exit={{ y: -8, filter: 'blur(4px)', opacity: 0 }}
                                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                className="flex items-center gap-1.5 whitespace-nowrap overflow-hidden"
                            >
                                <span className="text-[8px] flex-shrink-0">{statusScrollItem.icon}</span>
                                <div
                                    ref={statusContentRef}
                                    className={`text-[9px] font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text flex ${marqueeActive ? 'animate-marquee' : ''}`}
                                >
                                    <span className="whitespace-nowrap px-1">{statusScrollItem.content}</span>
                                    {marqueeActive && <span className="whitespace-nowrap px-1">{statusScrollItem.content}</span>}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <style>{`
                    @keyframes marquee {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .animate-marquee {
                        animation: marquee 8s linear infinite;
                    }
                `}</style>

                {/* 右侧：WiFi/数据 与电量图标 */}
                <div className="flex items-center gap-2 justify-end min-w-[40px]">
                    <div className="flex items-center">
                        {networkStatus.type === 'wifi' ? (
                            <Wifi size={12} className="opacity-80" />
                        ) : networkStatus.type === 'offline' ? (
                            <WifiOff size={11} className="opacity-80 text-red-500" />
                        ) : (
                            <Signal size={12} className="opacity-80" />
                        )}
                    </div>
                    <div className="flex items-center">
                        {settings.batteryStyle === 'emoji' ? <span className="text-xs">🔋</span> : <Battery size={12} className="opacity-80" />}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen bg-gray-900 flex items-center justify-center font-sans overflow-hidden p-2 style-${settings.fontFamily}`}>

            {/* 🚀 动态字体样式注入 */}
            <style>{`
                .style-pixel { font-family: 'Courier New', Courier, monospace !important; }
                .style-pixel button, .style-pixel span { letter-spacing: -1px; }
                .style-serif { font-family: Georgia, serif !important; }
                .style-serif h1 { font-style: italic; }
            `}</style>

            {/* 外部缩放包装器 */}
            <div className="phone-wrapper flex items-center justify-center">

                {/* 手机外壳容器 */}
                <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden ring-4 ring-gray-900/50">

                    {/* 灵动岛与全局状态栏 */}
                    {renderNotch()}
                    {renderStatusBar()}

                    {/* 桌面宠物 (User requested disable) */}
                    {/* <DesktopPet settings={settings} /> */}

                    {/* 屏幕内容区域 */}
                    <div className="w-full h-full bg-gray-900 relative">
                        <AnimatePresence mode="wait">

                            {/* 主屏幕：传入壁纸设置 */}
                            {!currentApp && (
                                <motion.div key="home" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }} transition={{ duration: 0.2 }} className="w-full h-full">
                                    <HomeScreen onOpenApp={openApp} settings={settings} systemTemp={systemTemp} />
                                </motion.div>
                            )}

                            {/* --- 重点：系统级应用 (Dock栏应用) --- */}
                            {currentApp === 'settings' && (
                                <motion.div key="settings" className="app-container">
                                    <SystemSettings
                                        onClose={closeApp}
                                        settings={settings}
                                        updateSetting={updateSetting}
                                        systemTemp={systemTemp}
                                    />
                                </motion.div>
                            )}
                            {currentApp === 'camera' && (
                                <motion.div key="camera" className="app-container">
                                    <RetroCamera onClose={closeApp} onSetWallpaper={(url) => updateSetting('wallpaper', url)} />
                                </motion.div>
                            )}
                            {currentApp === 'support' && (
                                <motion.div key="support" className="app-container">
                                    <SupportAuthor onClose={closeApp} />
                                </motion.div>
                            )}
                            {currentApp === 'gallery' && (
                                <motion.div key="gallery" className="app-container">
                                    <PhotoGallery onClose={closeApp} onSetWallpaper={(url) => updateSetting('wallpaper', url)} />
                                </motion.div>
                            )}

                            {/* --- 常规解压应用 (原有逻辑) --- */}
                            {currentApp === 'ac' && <motion.div key="ac" className="app-container"><VirtualAC onClose={closeApp} /></motion.div>}
                            {currentApp === 'fish' && <motion.div key="fish" className="app-container"><WoodenFish onClose={closeApp} /></motion.div>}
                            {currentApp === 'bubble' && <motion.div key="bubble" className="app-container"><BubbleWrap onClose={closeApp} /></motion.div>}
                            {currentApp === 'incense' && <motion.div key="incense" className="app-container"><CyberIncense onClose={closeApp} /></motion.div>}
                            {currentApp === 'switch' && <motion.div key="switch" className="app-container"><UselessSwitch onClose={closeApp} /></motion.div>}
                            {currentApp === 'purr' && <motion.div key="purr" className="app-container"><PurrTherapy onClose={closeApp} /></motion.div>}
                            {currentApp === 'mosquito' && <motion.div key="mosquito" className="app-container"><MosquitoHunter onClose={closeApp} /></motion.div>}
                            {currentApp === 'flush' && <motion.div key="flush" className="app-container"><EmotionFlush onClose={closeApp} /></motion.div>}
                            {currentApp === 'stick' && <motion.div key="stick" className="app-container"><CyberDivination onClose={closeApp} /></motion.div>}
                            {currentApp === 'fog' && <motion.div key="fog" className="app-container"><FoggyWindow onClose={closeApp} /></motion.div>}
                            {currentApp === 'crank' && <motion.div key="crank" className="app-container"><HandCrank onClose={closeApp} /></motion.div>}
                            {currentApp === 'bomb' && <motion.div key="bomb" className="app-container"><BombDefuser onClose={closeApp} /></motion.div>}
                            {currentApp === 'cultivation' && <motion.div key="cultivation" className="app-container"><DigitalCultivation onClose={closeApp} /></motion.div>}
                            {currentApp === 'safe' && <motion.div key="safe" className="app-container"><TheSafe onClose={closeApp} /></motion.div>}
                            {currentApp === 'sand' && <motion.div key="sand" className="app-container"><SandArt onClose={closeApp} /></motion.div>}
                            {currentApp === 'maze' && <motion.div key="maze" className="app-container"><GravityMaze onClose={closeApp} /></motion.div>}
                            {currentApp === 'pixel' && <motion.div key="pixel" className="app-container"><PixelCanvas onClose={closeApp} /></motion.div>}
                            {currentApp === 'wheel' && <motion.div key="wheel" className="app-container"><WheelOfFortune onClose={closeApp} /></motion.div>}
                            {currentApp === 'mood' && <motion.div key="mood" className="app-container"><MoodJournal onClose={closeApp} /></motion.div>}
                            {currentApp === 'soundboard' && <motion.div key="soundboard" className="app-container"><SoundBoard onClose={closeApp} /></motion.div>}
                            {currentApp === 'lifecounter' && <motion.div key="lifecounter" className="app-container"><LifeCounter onClose={closeApp} /></motion.div>}
                            {currentApp === 'bucketlist' && <motion.div key="bucketlist" className="app-container"><BucketList onClose={closeApp} /></motion.div>}
                            {currentApp === 'anniversary' && <motion.div key="anniversary" className="app-container"><Anniversary onClose={closeApp} /></motion.div>}

                        </AnimatePresence>
                    </div>

                    {/* 底部 Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-[100] pointer-events-none" />

                </div>
            </div>

            {/* 🚀 极致性能 CSS 引擎：移除繁重滤镜，优化 transform */}
            <style>{`
                :root {
                    --safe-area-top: 36px;
                }
                .phone-wrapper {
                    transform: scale(min(calc(100vh / 850), calc(100vw / 400)));
                    transform-origin: center center;
                    transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
                    flex-shrink: 0;
                    will-change: transform;
                }
                .app-container {
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 20;
                    background: #F8FAFC;
                    border-radius: 2.5rem; /* 🚀 修正圆角内径，完美贴合外壳 */
                    overflow: hidden; 
                    box-sizing: border-box;
                    animation: appJump 0.15s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards;
                    will-change: transform, opacity;
                }
                @keyframes appJump {
                    from { 
                        opacity: 0; 
                        transform: scale(0.92); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1);
                    }
                }
                /* 屏蔽滚动条 */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}

export default App;
