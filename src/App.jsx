import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { App as CapacitorApp } from '@capacitor/app';
import HomeScreen from './components/HomeScreen';
import { stopAllSounds } from './utils/audio';

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
import SoundBoard from './components/apps/SoundBoard'; // 新增的导入


function App() {
    // 当前打开的应用 ID，null 表示在主屏幕
    const [currentApp, setCurrentApp] = useState(null);

    const openApp = (appId) => setCurrentApp(appId);

    // 关闭应用时停止所有声音
    const closeApp = () => {
        stopAllSounds();
        setCurrentApp(null);
    };

    // 使用 Ref 追踪当前应用状态，以便在事件监听器中访问最新值
    const currentAppRef = React.useRef(currentApp);

    // 同步 Ref
    useEffect(() => {
        currentAppRef.current = currentApp;
    }, [currentApp]);

    // 监听 Android 物理返回键
    useEffect(() => {
        let backListener;
        const setupListener = async () => {
            backListener = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
                // 如果当前有应用打开，则关闭它
                if (currentAppRef.current) {
                    stopAllSounds();
                    setCurrentApp(null);
                } else {
                    // 如果在主屏幕，则退出/最小化应用
                    CapacitorApp.exitApp();
                }
            });
        };

        setupListener();

        return () => {
            if (backListener) backListener.remove();
        };
    }, []);


    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
            {/* 手机外壳容器 */}
            <div className="relative w-[375px] h-[812px] bg-black rounded-[3rem] shadow-2xl border-[8px] border-gray-800 overflow-hidden ring-4 ring-gray-900/50">

                {/* 灵动岛 / 刘海 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-50 flex justify-center items-center">
                    <div className="w-16 h-4 bg-black rounded-full" />
                </div>

                {/* 屏幕内容区域 */}
                <div className="w-full h-full bg-gray-900 relative">
                    <AnimatePresence mode="wait">

                        {/* 主屏幕 */}
                        {!currentApp && (
                            <motion.div key="home" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }} transition={{ duration: 0.3 }} className="w-full h-full">
                                <HomeScreen onOpenApp={openApp} />
                            </motion.div>
                        )}

                        {/* --- Phase 1 Apps --- */}
                        {currentApp === 'ac' && <motion.div key="ac" className="app-container"><VirtualAC onClose={closeApp} /></motion.div>}
                        {currentApp === 'fish' && <motion.div key="fish" className="app-container"><WoodenFish onClose={closeApp} /></motion.div>}
                        {currentApp === 'bubble' && <motion.div key="bubble" className="app-container"><BubbleWrap onClose={closeApp} /></motion.div>}
                        {currentApp === 'incense' && <motion.div key="incense" className="app-container"><CyberIncense onClose={closeApp} /></motion.div>}
                        {currentApp === 'switch' && <motion.div key="switch" className="app-container"><UselessSwitch onClose={closeApp} /></motion.div>}
                        {currentApp === 'purr' && <motion.div key="purr" className="app-container"><PurrTherapy onClose={closeApp} /></motion.div>}
                        {currentApp === 'mosquito' && <motion.div key="mosquito" className="app-container"><MosquitoHunter onClose={closeApp} /></motion.div>}

                        {/* --- Phase 2 Apps --- */}
                        {currentApp === 'flush' && <motion.div key="flush" className="app-container"><EmotionFlush onClose={closeApp} /></motion.div>}
                        {currentApp === 'stick' && <motion.div key="stick" className="app-container"><CyberDivination onClose={closeApp} /></motion.div>}
                        {currentApp === 'fog' && <motion.div key="fog" className="app-container"><FoggyWindow onClose={closeApp} /></motion.div>}
                        {currentApp === 'crank' && <motion.div key="crank" className="app-container"><HandCrank onClose={closeApp} /></motion.div>}
                        {currentApp === 'bomb' && <motion.div key="bomb" className="app-container"><BombDefuser onClose={closeApp} /></motion.div>}

                        {/* --- Phase 4 Apps --- */}
                        {currentApp === 'cultivation' && <motion.div key="cultivation" className="app-container"><DigitalCultivation onClose={closeApp} /></motion.div>}
                        {currentApp === 'safe' && <motion.div key="safe" className="app-container"><TheSafe onClose={closeApp} /></motion.div>}
                        {currentApp === 'sand' && <motion.div key="sand" className="app-container"><SandArt onClose={closeApp} /></motion.div>}

                        {/* --- Phase 5 Apps --- */}
                        {currentApp === 'maze' && <motion.div key="maze" className="app-container"><GravityMaze onClose={closeApp} /></motion.div>}
                        {currentApp === 'pixel' && <motion.div key="pixel" className="app-container"><PixelCanvas onClose={closeApp} /></motion.div>}
                        {currentApp === 'wheel' && <motion.div key="wheel" className="app-container"><WheelOfFortune onClose={closeApp} /></motion.div>}
                        {currentApp === 'mood' && <motion.div key="mood" className="app-container"><MoodJournal onClose={closeApp} /></motion.div>}

                        {/* 
                            ==========================================
                            步骤 2: 在这里注册路由
                            currentApp === '你的ID' (要和HomeScreen里的id一致)
                            ==========================================
                        */}
                        {currentApp === 'soundboard' && <motion.div key="soundboard" className="app-container"><SoundBoard onClose={closeApp} /></motion.div>}


                    </AnimatePresence>
                </div>

                {/* 底部 Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-50 pointer-events-none" />

                {/* 内联样式辅助类：统一动画 */}
                <style>{`
                    .app-container {
                        width: 100%;
                        height: 100%;
                        position: absolute;
                        top: 0;
                        left: 0;
                        z-index: 20;
                        animation: fadeIn 0.3s ease-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: scale(0.95); }
                        to { opacity: 1; transform: scale(1); }
                    }
                `}</style>
            </div>
        </div>
    );
}

export default App;
