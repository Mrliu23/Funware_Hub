import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, User, UserCheck, CloudRain, Zap, RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, LoopSound, stopAllSounds } from '../../utils/audio';

// --- DATA & CONSTANTS ---

const MAJOR_REALMS = [
    { name: "炼气", base: 100 },
    { name: "筑基", base: 500 },
    { name: "结丹", base: 2000 },
    { name: "元婴", base: 10000 },
    { name: "化神", base: 50000 },
    { name: "炼虚", base: 200000 },
    { name: "合体", base: 1000000 },
    { name: "大乘", base: 5000000 },
    { name: "真仙", base: 20000000 },
    { name: "金仙", base: 100000000 },
    { name: "太乙", base: 500000000 },
    { name: "大罗", base: 2000000000 },
    { name: "道祖", base: Infinity }
];
const SUB_STAGES = ["初期", "中期", "后期", "巅峰"];

const ALL_STAGES = [];
let cumulativeExp = 0;
MAJOR_REALMS.forEach((realm, mIdx) => {
    if (realm.name === "道祖") {
        ALL_STAGES.push({
            id: mIdx * 4,
            realm: realm.name,
            sub: "",
            fullName: realm.name,
            expReq: Infinity,
            isMajorBreakthrough: false
        });
    } else {
        SUB_STAGES.forEach((sub, sIdx) => {
            const stepExp = Math.floor(realm.base * Math.pow(1.5, sIdx));
            cumulativeExp += stepExp;
            ALL_STAGES.push({
                id: mIdx * 4 + sIdx,
                realm: realm.name,
                sub: sub,
                fullName: `${realm.name}${sub}`,
                expReq: cumulativeExp,
                isMajorBreakthrough: sIdx === 3
            });
        });
    }
});

const SPECIES = [
    { id: 'human', name: '人族', desc: '悟性极高，修炼速度快 (+20%)', expRate: 1.2, thunderResist: 0.05, auraColor: { male: 'from-cyan-400 to-blue-600', female: 'from-pink-300 to-purple-500' } },
    { id: 'demon', name: '妖族', desc: '肉身强横，雷劫抵抗高 (+20%)', expRate: 1.0, thunderResist: 0.2, auraColor: { male: 'from-red-600 to-orange-600', female: 'from-rose-500 to-red-400' } },
    { id: 'dragon', name: '龙族', desc: '天生神灵，气运加身 (低保成功率)', expRate: 1.0, thunderResist: 0.15, auraColor: { male: 'from-yellow-300 to-amber-500', female: 'from-yellow-200 to-amber-400' } },
    { id: 'custom', name: '自创血脉', desc: '天地异种，潜力无限', expRate: 1.1, thunderResist: 0.1, auraColor: { male: 'from-emerald-400 to-teal-500', female: 'from-emerald-300 to-teal-400' } }
];

const FRUITS = [
    { name: "朱果", expMod: 0.05, days: 5, color: "bg-red-500 shadow-[0_0_15px_#ef4444]", icon: "🍎" },
    { name: "蟠桃", expMod: 0.10, days: 10, color: "bg-pink-400 shadow-[0_0_20px_#f472b6]", icon: "🍑" },
    { name: "人参果", expMod: 0.15, days: 15, color: "bg-green-400 shadow-[0_0_20px_#4ade80]", icon: "👶" },
    { name: "黄中李", expMod: 0.20, days: 20, color: "bg-yellow-400 shadow-[0_0_25px_#facc15]", icon: "🍋" }
];

const generateLightningPath = (sx, sy, ex, ey, complexity = 0.5) => {
    let points = [{ x: sx, y: sy }, { x: ex, y: ey }];
    for (let i = 0; i < 4; i++) {
        const newPoints = [];
        for (let j = 0; j < points.length - 1; j++) {
            const p1 = points[j];
            const p2 = points[j + 1];
            newPoints.push(p1);
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            const jitter = (Math.random() - 0.5) * dist * complexity;
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const perpX = Math.cos(angle + Math.PI / 2) * jitter;
            const perpY = Math.sin(angle + Math.PI / 2) * jitter;
            newPoints.push({ x: midX + perpX, y: midY + perpY });
        }
        newPoints.push(points[points.length - 1]);
        points = newPoints;
    }
    return "M " + points.map(p => `${p.x},${p.y}`).join(" L ");
};

const DigitalCultivation = ({ onClose }) => {
    const [gameState, setGameState] = useState(() => {
        const saved = localStorage.getItem('cultivation_state_v2');
        return saved ? JSON.parse(saved) : null;
    });

    const [reincarnationData, setReincarnationData] = useState(null);

    const handleReincarnate = (currentLevelId) => {
        const targetLevel = Math.max(0, currentLevelId - 4);
        setReincarnationData({ levelId: targetLevel });
        setGameState(null);
    };

    if (!gameState) {
        return <CharacterCreation
            reincarnationData={reincarnationData}
            onComplete={(data) => {
                const startLevel = reincarnationData ? reincarnationData.levelId : 0;
                const startExp = startLevel > 0 ? ALL_STAGES[startLevel - 1].expReq : 0;
                const initialState = { char: data, exp: startExp, levelId: startLevel, failBuff: 0 };
                setGameState(initialState);
                localStorage.setItem('cultivation_state_v2', JSON.stringify(initialState));
                setReincarnationData(null);
            }}
            onClose={onClose}
        />;
    }

    return <GameLoop gameState={gameState} setGameState={setGameState} onClose={onClose} onReincarnateRequest={() => handleReincarnate(gameState.levelId)} />;
};

const GameLoop = ({ gameState, setGameState, onClose, onReincarnateRequest }) => {
    const { char, exp, levelId, failBuff } = gameState;
    const currentStage = ALL_STAGES[levelId];
    const species = SPECIES.find(s => s.id === char.speciesId) || SPECIES[3];
    const genderKey = char.gender === 'male' ? 'male' : 'female';
    const auraGradient = (species.auraColor && species.auraColor[genderKey]) ? species.auraColor[genderKey] : 'from-white to-slate-400';

    const [isMeditating, setIsMeditating] = useState(false);
    const [weather, setWeather] = useState('clear');
    const [phase, setPhase] = useState('normal');
    const [tribulationRound, setTribulationRound] = useState(0);
    const [lightningActive, setLightningActive] = useState(false);
    const [showReincarnateConfirm, setShowReincarnateConfirm] = useState(false);
    const [breakthroughTimer, setBreakthroughTimer] = useState(0);
    const [lightningPaths, setLightningPaths] = useState([]);
    const [fruit, setFruit] = useState(null); // { id, type, x, y, deadTime }
    const [floatingTexts, setFloatingTexts] = useState([]); // { id, text, x, y }

    const bgmRef = useRef(null);
    const breakthroughAudioRef = useRef(null);
    const effectAudioRef = useRef(null);
    const tribulationTimerRef = useRef(null);
    const lastPos = useRef({ x: 0, y: 0, z: 0 });

    useEffect(() => { localStorage.setItem('cultivation_state_v2', JSON.stringify(gameState)); }, [gameState]);

    useEffect(() => {
        bgmRef.current = new LoopSound('meditation_bg.mp3');
        return () => {
            if (bgmRef.current) bgmRef.current.stop();
            stopAllImmediateEffects();
        };
    }, []);

    const stopAllImmediateEffects = () => {
        stopAllSounds();
        if (tribulationTimerRef.current) {
            clearTimeout(tribulationTimerRef.current);
            tribulationTimerRef.current = null;
        }
        setLightningActive(false);
        // Do NOT clear fruit
    };

    // Helper: Floating Text
    const spawnFloatingText = (text, x, y, color = 'text-amber-300') => {
        const id = Date.now() + Math.random();
        setFloatingTexts(prev => [...prev, { id, text, x, y, color }]);
        setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== id)), 1500);
    };

    // Calculations
    const currentRealmEnd = currentStage.expReq;
    const prevRealmEnd = levelId > 0 ? ALL_STAGES[levelId - 1].expReq : 0;
    const stageSpan = currentRealmEnd === Infinity ? 1 : (currentRealmEnd - prevRealmEnd);
    const progressRaw = exp - prevRealmEnd;
    const progressPercent = currentRealmEnd === Infinity ? 100 : Math.min(100, Math.max(0, (progressRaw / stageSpan) * 100));

    // Fruit Logic
    useEffect(() => {
        if (!isMeditating || phase !== 'normal') return;

        // Try to spawn fruit
        const spawnInterval = setInterval(() => {
            if (fruit) return;

            // 20% Chance every 5s check
            if (Math.random() < 0.2) {
                const type = FRUITS[Math.floor(Math.random() * FRUITS.length)];
                const lifeTime = 60 + Math.floor(Math.random() * 60);

                // Generate valid coordinates (Avoid Center 30-70%)
                let finalX, finalY;
                let attempts = 0;
                while (attempts < 10) {
                    const tx = 10 + Math.random() * 80;
                    const ty = 15 + Math.random() * 55; // Keep roughly in middle vertical band

                    // Distance check from center (50, 45 approx)
                    // Center area is approx rect from x:25-75, y:25-65
                    if (!(tx > 25 && tx < 75 && ty > 25 && ty < 65)) {
                        finalX = tx;
                        finalY = ty;
                        break;
                    }
                    attempts++;
                }

                if (finalX) {
                    setFruit({
                        id: Date.now(),
                        type,
                        x: finalX,
                        y: finalY,
                        deadTime: Date.now() + lifeTime * 1000,
                        lifeTime
                    });
                }
            }
        }, 5000);

        return () => clearInterval(spawnInterval);
    }, [isMeditating, phase, fruit]);

    // Fruit Timer Cleanup
    useEffect(() => {
        if (!fruit) return;
        const checkInterval = setInterval(() => {
            if (Date.now() > fruit.deadTime) {
                setFruit(null);
            }
        }, 1000);
        return () => clearInterval(checkInterval);
    }, [fruit]);

    const handleEatFruit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!fruit) return;

        // No sound when eating fruit
        const gain = stageSpan * fruit.type.expMod;

        spawnFloatingText(`吞服${fruit.type.name}! 修为 +${formatExp(gain)}`, fruit.x + '%', fruit.y + '%');

        setGameState(prev => ({
            ...prev,
            exp: prev.exp + gain
        }));
        setFruit(null);
    };

    // Weather & Timer Logic
    useEffect(() => {
        if (phase === 'tribulation') setWeather('storm');
        else if (progressPercent > 80 && currentStage.isMajorBreakthrough) setWeather('gathering');
        else setWeather('clear');
    }, [progressPercent, phase, currentStage.isMajorBreakthrough]);

    useEffect(() => {
        let timerInterval;
        if (phase === 'breakthrough_celebration' && breakthroughTimer > 0) {
            timerInterval = setInterval(() => {
                setBreakthroughTimer(prev => {
                    if (prev <= 1) { completeBreakthrough(); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerInterval);
    }, [phase, breakthroughTimer]);

    useEffect(() => {
        if (phase !== 'normal' || showReincarnateConfirm) {
            if (bgmRef.current) bgmRef.current.stop();
            return;
        }
        const handleMotion = (e) => {
            if (!isMeditating) return;
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;
            const delta = Math.abs(acc.x - lastPos.current.x) + Math.abs(acc.y - lastPos.current.y) + Math.abs(acc.z - lastPos.current.z);
            lastPos.current = { x: acc.x, y: acc.y, z: acc.z };
            if (delta > 2.5) {
                playSound('glass_grid.mp3');
                if (navigator.vibrate) navigator.vibrate(200);
                setIsMeditating(false);
            }
        };
        window.addEventListener('devicemotion', handleMotion);
        if (isMeditating) bgmRef.current.play(); else bgmRef.current.stop();
        return () => {
            window.removeEventListener('devicemotion', handleMotion);
            if (bgmRef.current) bgmRef.current.stop();
        };
    }, [isMeditating, phase, showReincarnateConfirm]);

    useEffect(() => {
        let interval;
        if (isMeditating && phase === 'normal' && !showReincarnateConfirm) {
            interval = setInterval(() => {
                setGameState(prev => {
                    if (!ALL_STAGES[prev.levelId + 1]) return prev;
                    const cStage = ALL_STAGES[prev.levelId];
                    const cMax = cStage.expReq;
                    if (prev.exp >= cMax) {
                        setIsMeditating(false);
                        if (cStage.isMajorBreakthrough) startTribulation();
                        else startMinorBreakthrough();
                        return prev;
                    }
                    const pEnd = prev.levelId > 0 ? ALL_STAGES[prev.levelId - 1].expReq : 0;
                    const cSpan = cMax - pEnd;
                    const targetTicks = 300 + (prev.levelId * 30);
                    const baseGain = cSpan / targetTicks;
                    const actualGain = baseGain * (species.expRate || 1);
                    return { ...prev, exp: prev.exp + actualGain };
                });
            }, 200);
        }
        return () => clearInterval(interval);
    }, [isMeditating, phase, showReincarnateConfirm]);

    // Events
    const startMinorBreakthrough = () => {
        setPhase('breakthrough_celebration');
        setBreakthroughTimer(15);
        breakthroughAudioRef.current = playSound('cultivation_breakthrough.mp3');
    };
    const startTribulation = () => {
        setPhase('tribulation');
        setTribulationRound(0);
        runTribulationRound(1);
    };
    const runTribulationRound = (round) => {
        if (round > 8) {
            setPhase('breakthrough_celebration');
            setBreakthroughTimer(15);
            breakthroughAudioRef.current = playSound('cultivation_success.mp3');
            return;
        }
        setTribulationRound(round);
        tribulationTimerRef.current = setTimeout(() => {
            triggerLightning();
            const realmIdx = Math.floor(levelId / 4);
            const difficultyScale = realmIdx * 0.03;
            const resistance = species.thunderResist || 0;
            const currentFailBuff = failBuff || 0;
            const baseBoltChance = 0.98 - difficultyScale;
            const finalChance = Math.min(0.99, baseBoltChance + resistance + currentFailBuff);
            const roll = Math.random();
            if (roll < finalChance) {
                tribulationTimerRef.current = setTimeout(() => runTribulationRound(round + 1), 2000 + Math.random() * 500);
            } else { handleTribulationFail(); }
        }, 800 + Math.random() * 500);
    };
    const triggerLightning = () => {
        effectAudioRef.current = playSound('thunder_heavy.mp3');
        if (navigator.vibrate) navigator.vibrate([30, 30, 100, 30, 20, 500]);
        const paths = [];
        paths.push({ d: generateLightningPath(50, 0, 50, 60, 0.4), width: 4, opacity: 1 });
        paths.push({ d: generateLightningPath(40, 0, 30, 50, 0.6), width: 1.5, opacity: 0.7 });
        paths.push({ d: generateLightningPath(60, 0, 70, 45, 0.6), width: 1.5, opacity: 0.7 });
        setLightningPaths(paths);
        setLightningActive(true);
        setTimeout(() => setLightningActive(false), 200 + Math.random() * 200);
    };
    const handleTribulationFail = () => {
        stopAllImmediateEffects();
        playSound('glass_grid.mp3');
        setPhase('normal');
        setWeather('clear');
        setGameState(prev => {
            const base = prev.levelId > 0 ? ALL_STAGES[prev.levelId - 1].expReq : 0;
            const needed = ALL_STAGES[prev.levelId].expReq - base;
            return { ...prev, exp: Math.max(base, prev.exp - (needed * 0.3)), failBuff: (prev.failBuff || 0) + 0.05 };
        });
        setIsMeditating(false);
    };
    const completeBreakthrough = () => {
        stopAllImmediateEffects();
        setPhase('normal');
        setWeather('clear');
        setBreakthroughTimer(0);
        setIsMeditating(true);
        if (bgmRef.current) bgmRef.current.play();
        setGameState(prev => ({ ...prev, levelId: prev.levelId + 1, exp: prev.exp + 100, failBuff: 0 }));
    };

    const getAvatar = () => {
        if (char.customAvatar) return char.customAvatar;
        if (char.speciesId === 'human') return char.gender === 'male' ? '/images/cultivator_human_male.png' : '/images/cultivator_human_female.png';
        if (char.speciesId === 'demon') return '/images/cultivator_demon_female.png';
        if (char.speciesId === 'dragon') return '/images/cultivator_dragon_male.png';
        return '';
    };
    const formatExp = (num) => {
        if (num > 100000000) return (num / 100000000).toFixed(2) + '亿';
        if (num > 10000) return (num / 10000).toFixed(1) + '万';
        return Math.floor(num);
    };

    const cloudOpacity = weather === 'clear' ? 0 : (weather === 'gathering' ? 0.7 : 0.95);
    const isDark = weather !== 'clear';

    return (
        <div className={`h-full flex flex-col relative overflow-hidden transition-colors duration-1000 ${isDark ? 'bg-slate-950' : 'bg-slate-900'} text-slate-100`}>
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#334155_0%,#020617_100%)] opacity-80" />
                <div className="absolute inset-0 transition-opacity duration-2000 flex flex-col items-center justify-start pt-10" style={{ opacity: cloudOpacity }}>
                    <div className="absolute top-[-30%] left-[-20%] w-[150%] h-[70%] bg-slate-800/90 blur-[60px] animate-pulse" style={{ animationDuration: '4s' }} />
                    <div className="absolute top-[-20%] right-[-30%] w-[140%] h-[60%] bg-slate-900/95 blur-[50px] animate-pulse" style={{ animationDuration: '5s' }} />
                    <div className="absolute top-[-40%] inset-x-0 h-[80%] bg-neutral-900/80 blur-[80px]" />
                    {weather === 'storm' && <div className="absolute inset-0 bg-black/50 mix-blend-multiply transition-colors duration-500" />}
                </div>
                {weather === 'storm' && <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/82/Rain_drops.gif')] opacity-15 bg-repeat mix-blend-overlay" />}
                {lightningActive && <div className="absolute inset-0 bg-indigo-50/20 z-50 mix-blend-overlay animate-flash" />}
                <AnimatePresence>
                    {lightningActive && (
                        <div className="absolute inset-0 z-40 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-purple-200 overflow-visible">
                                {lightningPaths.map((p, i) => (
                                    <motion.path key={i} d={p.d} stroke="currentColor" strokeWidth={p.width} fill="none" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: p.opacity }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: "circOut" }} />
                                ))}
                            </svg>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* FRUIT LAYER - Moved to Top Level for Interactivity */}
            <AnimatePresence>
                {fruit && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={`absolute z-[60] w-16 h-16 rounded-full flex flex-col items-center justify-center text-3xl cursor-pointer pointer-events-auto ${fruit.type.color} animate-bounce drop-shadow-xl border-2 border-white/30`}
                        style={{ left: `${fruit.x}%`, top: `${fruit.y}%` }}
                        onClick={handleEatFruit}
                        onTouchStart={handleEatFruit}
                    >
                        {fruit.type.icon}
                        <div className="absolute -bottom-6 text-xs font-bold text-white bg-black/60 px-2 py-0.5 rounded whitespace-nowrap">
                            {Math.max(0, Math.ceil((fruit.deadTime - Date.now()) / 1000))}秒
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Texts Layer */}
            {floatingTexts.map(ft => (
                <motion.div key={ft.id} initial={{ y: 0, opacity: 1 }} animate={{ y: -80, opacity: 0 }} transition={{ duration: 1.5 }} className={`absolute z-[70] font-bold text-shadow-lg text-lg ${ft.color} pointer-events-none`} style={{ left: ft.x, top: ft.y }}>
                    {ft.text}
                </motion.div>
            ))}

            <div className="relative z-20 top-4 left-4 right-4 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                    <button onClick={onClose} className="p-2 bg-slate-800/50 rounded-full border border-slate-700 backdrop-blur-sm"><ArrowLeft size={20} /></button>
                    <div className="flex flex-col">
                        <span className="text-xs text-slate-400 font-mono tracking-tighter">DAO: {char.name}</span>
                        <span className="text-[10px] text-slate-500">{char.speciesId === 'custom' ? char.customSpeciesName : species.name}</span>
                    </div>
                </div>
                <button onClick={() => setShowReincarnateConfirm(true)} className="p-2 bg-slate-800/50 rounded-full border border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-500 transition-colors"><RefreshCw size={18} /></button>
            </div>

            <AnimatePresence>
                {showReincarnateConfirm && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-8 backdrop-blur"><div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-xs text-center shadow-xl"><AlertTriangle size={48} className="mx-auto text-amber-500 mb-4" /><h3 className="text-xl font-bold text-amber-500 mb-2">兵解重修？</h3><p className="text-slate-400 text-sm mb-6 leading-relaxed">欲重塑肉身，必先废去部分修为。<br />确认后将<span className="text-red-400 font-bold">跌落一个大境界</span><br />并返回角色创建界面。</p><div className="flex gap-3"><button onClick={() => setShowReincarnateConfirm(false)} className="flex-1 py-2 bg-slate-800 rounded text-slate-400">再想想</button><button onClick={() => { onReincarnateRequest(); setShowReincarnateConfirm(false); }} className="flex-1 py-2 bg-amber-800 rounded text-white font-bold">兵解</button></div></div></motion.div>}
            </AnimatePresence>

            <div className={`flex-1 flex flex-col items-center justify-center relative z-10 transition-transform duration-100 ${lightningActive ? 'translate-x-[2px] translate-y-[2px]' : ''}`}>
                <div className="text-center mb-8 relative">
                    <motion.h1 className="text-5xl font-black font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-slate-100 to-slate-500 drop-shadow-lg">
                        {phase === 'tribulation' ? '渡劫中' : currentStage.realm}
                    </motion.h1>
                    <motion.div className="text-xl font-serif text-amber-500 mt-2 tracking-[0.5em]">
                        {phase === 'tribulation' ? `第 ${tribulationRound} 道` : currentStage.sub}
                    </motion.div>
                </div>

                <div
                    className="relative w-72 h-72 cursor-pointer flex items-center justify-center group"
                    onClick={() => {
                        if (phase === 'normal') setIsMeditating(!isMeditating);
                        else if (phase === 'breakthrough_celebration') completeBreakthrough();
                    }}
                >
                    {/* AURA EFFECTS - Arc Flames Wrapping Around Avatar */}
                    {isMeditating && phase === 'normal' && (
                        <>
                            {/* Left Arc - 280px to wrap around 235px scaled avatar */}
                            <motion.div
                                className="absolute pointer-events-none"
                                style={{
                                    width: '280px',
                                    height: '280px',
                                    left: '50%',
                                    top: '50%',
                                    marginLeft: '-140px',
                                    marginTop: '-140px',
                                    borderRadius: '50%',
                                    borderWidth: '8px',
                                    borderStyle: 'solid',
                                    borderColor: 'transparent',
                                    borderLeftColor: species.id === 'demon' ? '#ef4444' : species.id === 'dragon' ? '#fbbf24' : char.gender === 'female' ? '#f472b6' : '#22d3ee',
                                    borderBottomColor: species.id === 'demon' ? '#ef4444' : species.id === 'dragon' ? '#fbbf24' : char.gender === 'female' ? '#f472b6' : '#22d3ee',
                                }}
                                animate={{
                                    rotate: [-45, -30, -45],
                                    opacity: [0.8, 1, 0.8],
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Right Arc - starts at bottom, wraps to right side */}
                            <motion.div
                                className="absolute pointer-events-none"
                                style={{
                                    width: '280px',
                                    height: '280px',
                                    left: '50%',
                                    top: '50%',
                                    marginLeft: '-140px',
                                    marginTop: '-140px',
                                    borderRadius: '50%',
                                    borderWidth: '8px',
                                    borderStyle: 'solid',
                                    borderColor: 'transparent',
                                    borderRightColor: species.id === 'demon' ? '#ef4444' : species.id === 'dragon' ? '#fbbf24' : char.gender === 'female' ? '#f472b6' : '#22d3ee',
                                    borderBottomColor: species.id === 'demon' ? '#ef4444' : species.id === 'dragon' ? '#fbbf24' : char.gender === 'female' ? '#f472b6' : '#22d3ee',
                                }}
                                animate={{
                                    rotate: [45, 30, 45],
                                    opacity: [0.8, 1, 0.8],
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5
                                }}
                            />

                            {/* Outer subtle glow */}
                            <motion.div
                                className="absolute pointer-events-none rounded-full"
                                style={{
                                    width: '290px',
                                    height: '290px',
                                    left: '50%',
                                    top: '50%',
                                    marginLeft: '-145px',
                                    marginTop: '-145px',
                                    boxShadow: `0 0 40px 10px ${species.id === 'demon' ? 'rgba(239,68,68,0.25)' : species.id === 'dragon' ? 'rgba(251,191,36,0.25)' : char.gender === 'female' ? 'rgba(244,114,182,0.25)' : 'rgba(34,211,238,0.25)'}`,
                                }}
                                animate={{ opacity: [0.4, 0.7, 0.4] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </>
                    )}

                    <div className={`relative w-56 h-56 z-10 rounded-full overflow-hidden border-4 transition-all duration-500 ${phase === 'tribulation' ? 'border-purple-500 shadow-[0_0_30px_#9333ea]' : 'border-slate-800 shadow-2xl'} ${isMeditating ? 'scale-105' : 'scale-100'}`}>
                        <img src={getAvatar()} alt="Avatar" className={`w-full h-full object-cover transition-all duration-1000 ${phase === 'breakthrough_celebration' ? 'brightness-150 contrast-125' : ''}`} />
                        {lightningActive && <div className="absolute inset-0 bg-purple-500/50 mix-blend-color-dodge" />}
                    </div>
                    {phase === 'breakthrough_celebration' && (
                        <>
                            <motion.div className="absolute inset-[-50%] z-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,#fbbf24_180deg,transparent_360deg)] opacity-30" animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
                            <div className="absolute top-[-50px] text-amber-400 font-bold text-2xl animate-bounce">境界突破!</div>
                            <div className="absolute bottom-[-40px] text-slate-400 text-xs animate-pulse">点击跳过感悟 ({breakthroughTimer}s)</div>
                        </>
                    )}
                    {phase === 'normal' && !isMeditating && (
                        <div className="absolute -bottom-12 text-slate-500 text-xs animate-bounce tracking-widest">
                            {weather === 'gathering' ? "乌云压顶... 劫数将至" : "点击打坐 积攒修为"}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full p-8 relative z-20">
                <div className="flex justify-between text-xs text-slate-500 mb-2 font-mono">
                    <span>修为</span>
                    {phase === 'tribulation' ? (
                        <span className="text-purple-400 animate-pulse">!! 正在应劫 !!</span>
                    ) : (
                        <span>{formatExp(exp)} / {currentStage.expReq === Infinity ? 'MAX' : formatExp(currentStage.expReq)}</span>
                    )}
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                        className={`h-full relative ${phase === 'tribulation' ? 'bg-purple-600' : 'bg-gradient-to-r from-slate-600 to-amber-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.2, ease: "linear" }}
                    >
                        <div className="absolute right-0 top-0 h-full w-[2px] bg-white/50 shadow-[0_0_10px_white]" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// ... CharacterCreation remains same ...
const CharacterCreation = ({ onComplete, onClose, reincarnationData }) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState("");
    const [gender, setGender] = useState("male");
    const [speciesId, setSpeciesId] = useState("human");
    const [customSpeciesName, setCustomSpeciesName] = useState("");
    const [customAvatar, setCustomAvatar] = useState(null);
    useEffect(() => { if (reincarnationData) setStep(1); }, [reincarnationData]);
    if (step === 0) return <div className="h-full bg-black flex flex-col items-center justify-center p-8 text-center"><h2 className="text-2xl text-red-600 font-bold mb-4">天机不可泄</h2><p className="text-slate-400 mb-8">此去经年，肉身唯一。<br />选定不可更改。</p><button onClick={() => setStep(1)} className="px-8 py-3 bg-red-800 text-white rounded-lg">我意已决</button></div>;
    const handleFileChange = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setCustomAvatar(reader.result); reader.readAsDataURL(file); } };
    const getPreview = () => { if (customAvatar) return customAvatar; if (speciesId === 'human') return gender === 'male' ? '/images/cultivator_human_male.png' : '/images/cultivator_human_female.png'; if (speciesId === 'demon') return '/images/cultivator_demon_female.png'; if (speciesId === 'dragon') return '/images/cultivator_dragon_male.png'; return ''; };
    return (
        <div className="h-full bg-slate-950 text-slate-200 p-6 flex flex-col items-center overflow-y-auto">
            {reincarnationData && <div className="w-full bg-amber-900/30 border border-amber-600/50 rounded-lg p-3 mb-6 text-center animate-pulse"><div className="text-amber-500 font-bold mb-1">正在兵解重修</div><div className="text-xs text-slate-400">保留修为至：<span className="text-slate-200 font-bold ml-1">{ALL_STAGES[reincarnationData.levelId].fullName}</span></div></div>}
            <div className="relative mb-6 group cursor-pointer" onClick={() => document.getElementById('c_upload').click()}>
                <img src={getPreview()} className="w-40 h-40 rounded-full border-4 border-slate-700 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"><Upload /></div>
                <input id="c_upload" type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>
            <p className="text-xs text-slate-500 mb-4">点击上传自拍</p>
            <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 mb-4 text-center" placeholder="道号" value={name} onChange={e => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2 w-full mb-4">
                {SPECIES.map(s => <div key={s.id} onClick={() => setSpeciesId(s.id)} className={`p-3 border rounded ${speciesId === s.id ? 'border-amber-500 bg-amber-900/20' : 'border-slate-800'}`}><div className="font-bold">{s.name}</div><div className="text-[10px] text-slate-500">{s.desc}</div></div>)}
            </div>
            {speciesId === 'custom' && <input className="w-full bg-slate-900 border rounded p-3 mb-4 text-amber-500" placeholder="种族名称" value={customSpeciesName} onChange={e => setCustomSpeciesName(e.target.value)} />}
            <div className="flex gap-4 w-full mb-6">
                <button onClick={() => setGender('male')} className={`flex-1 p-3 rounded border ${gender === 'male' ? 'border-blue-500' : 'border-slate-700'}`}>男修</button>
                <button onClick={() => setGender('female')} className={`flex-1 p-3 rounded border ${gender === 'female' ? 'border-pink-500' : 'border-slate-700'}`}>女修</button>
            </div>
            <button onClick={() => { if (name) onComplete({ name, gender, speciesId, customSpeciesName, customAvatar }) }} disabled={!name} className="w-full py-4 bg-amber-700 text-white font-bold rounded-xl">{reincarnationData ? "重塑金身" : "开启修仙"}</button>
        </div>
    );
};

export default DigitalCultivation;
