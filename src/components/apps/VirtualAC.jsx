import React, { useState, useEffect } from 'react';
import { Power, ChevronUp, ChevronDown, Snowflake, Sun, Wind } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, LoopSound } from '../../utils/audio';

const VirtualAC = ({ onClose }) => {
    const [power, setPower] = useState(false);
    const [temp, setTemp] = useState(26);
    const [mode, setMode] = useState('cool'); // cool, heat
    const acLoopRef = React.useRef(null);

    useEffect(() => {
        acLoopRef.current = new LoopSound('ac_work.mp3');
        return () => acLoopRef.current.stop();
    }, []);

    // Sound effect logic
    useEffect(() => {
        if (power) {
            acLoopRef.current.play();
        } else {
            if (acLoopRef.current) acLoopRef.current.stop();
        }
    }, [power]);

    const togglePower = () => {
        playSound('ac_beep.mp3');
        setPower(!power);
    };
    const increaseTemp = () => {
        if (power) {
            playSound('ac_beep.mp3');
            setTemp(t => Math.min(t + 1, 30));
        }
    };
    const decreaseTemp = () => {
        if (power) {
            playSound('ac_beep.mp3');
            setTemp(t => Math.max(t - 1, 16));
        }
    };

    return (
        <div className="h-full flex flex-col bg-white text-gray-800 relative">
            {/* Header / Back Button */}
            <div className="absolute top-10 left-4 z-10">
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full shadow-sm">
                    <ChevronDown className="rotate-90" size={24} />
                </button>
            </div>

            {/* AC Unit Display */}
            <div className="flex-1 flex flex-col items-center justify-start pt-20 bg-gray-50">
                <div className="relative w-80 h-32 bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col items-end pr-6 pt-4 overflow-hidden">
                    {/* AC Vents */}
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gray-100 border-t border-gray-200 flex items-center justify-center">
                        <motion.div
                            animate={{ rotateX: power ? 180 : 0 }}
                            className="w-11/12 h-full bg-gray-200 origin-top"
                        />
                    </div>
                    {/* Display on Unit */}
                    <AnimatePresence>
                        {power && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-3xl font-mono font-bold text-blue-500 tracking-widest"
                            >
                                {temp}°C
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {/* Status Light */}
                    <div className={`absolute top-4 right-2 w-1.5 h-1.5 rounded-full ${power ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-gray-300'}`} />

                    {/* Wind Stream Animation (CSS Art) */}
                    {power && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.5, y: 40 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-gradient-to-b from-blue-100/50 to-transparent pointer-events-none blur-xl"
                        />
                    )}
                </div>
            </div>

            {/* Remote Control */}
            <div className="flex-1 bg-gray-100 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-8 flex flex-col items-center justify-center gap-6">

                {/* Screen on Remote */}
                <div className="w-full bg-emerald-50 rounded-lg border border-emerald-100 p-4 h-24 flex items-center justify-between px-8 mb-4 shadow-inner">
                    {power ? (
                        <>
                            <div className="flex flex-col">
                                <span className="text-xs text-emerald-800 font-bold">MODE</span>
                                {mode === 'cool' ? <Snowflake size={20} className="text-blue-500" /> : <Sun size={20} className="text-orange-500" />}
                            </div>
                            <div className="text-4xl font-mono font-bold text-emerald-900">{temp}°</div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-emerald-800 font-bold">FAN</span>
                                <Wind size={20} className="text-emerald-700" />
                            </div>
                        </>
                    ) : (
                        <span className="text-emerald-300 text-sm mx-auto">OFF</span>
                    )}
                </div>

                {/* Buttons Grid */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-xs">
                    <button
                        onClick={togglePower}
                        className="col-span-1 aspect-square rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <Power size={24} />
                    </button>

                    <div className="col-span-1 flex flex-col gap-3">
                        <button onClick={increaseTemp} className="flex-1 bg-white rounded-lg shadow flex items-center justify-center active:bg-gray-50">
                            <ChevronUp size={24} />
                        </button>
                        <button onClick={decreaseTemp} className="flex-1 bg-white rounded-lg shadow flex items-center justify-center active:bg-gray-50">
                            <ChevronDown size={24} />
                        </button>
                    </div>

                    <button
                        onClick={() => power && setMode(m => m === 'cool' ? 'heat' : 'cool')}
                        className="col-span-1 aspect-square rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <span className="text-xs font-bold">{mode === 'cool' ? 'COOL' : 'HEAT'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VirtualAC;
