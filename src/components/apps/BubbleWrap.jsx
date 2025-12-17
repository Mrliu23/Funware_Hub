import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowLeft, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';

const COMPLETION_MESSAGES = [
    "你真无聊！",
    "强迫症治愈了没？",
    "恭喜你，浪费了人生中宝贵的30秒",
    "手感不错吧？再来一张？",
    "老板：这就是你加班的成果？",
    "把它们复原比捏破难多了",
    "可以，这很解压",
    "屏幕快被你戳烂了...",
    "哇哦，Bubble Wrap Master!",
    "寂寞，是无敌的。"
];

const BubbleWrap = ({ onClose }) => {
    // 6x8 grid = 48 bubbles
    const [bubbles, setBubbles] = useState(() => {
        try {
            const saved = localStorage.getItem('bubble_wrap_state');
            return saved ? JSON.parse(saved) : Array(48).fill(false);
        } catch (e) {
            return Array(48).fill(false);
        }
    });
    const [finished, setFinished] = useState(false);
    const [finishMsg, setFinishMsg] = useState("");

    const popBubble = (index) => {
        if (!bubbles[index]) {
            const newBubbles = [...bubbles];
            newBubbles[index] = true;
            setBubbles(newBubbles);
            playSound('bubble_pop.mp3');

            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    };

    // Check for win condition
    useEffect(() => {
        if (bubbles.every(Boolean) && !finished) {
            setFinished(true);
            const randomMsg = COMPLETION_MESSAGES[Math.floor(Math.random() * COMPLETION_MESSAGES.length)];
            setFinishMsg(randomMsg);
        }
    }, [bubbles, finished]);

    // Persistence
    useEffect(() => {
        localStorage.setItem('bubble_wrap_state', JSON.stringify(bubbles));
    }, [bubbles]);

    const reset = () => {
        setBubbles(Array(48).fill(false));
        setFinished(false);
    };

    return (
        <div className="h-full flex flex-col bg-orange-50 relative">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 bg-white shadow-sm z-10">
                <button onClick={onClose} className="p-2 bg-gray-100 rounded-full">
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h2 className="font-bold text-lg text-gray-700">解压泡泡纸</h2>
                <button onClick={reset} className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <RotateCcw size={24} />
                </button>
            </div>

            {/* Completion Overlay */}
            <AnimatePresence>
                {finished && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
                    >
                        <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm text-center">
                            <div className="w-16 h-16 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trophy size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">全部捏完了！</h3>
                            <p className="text-gray-600 text-lg mb-8 font-medium">“{finishMsg}”</p>
                            <button
                                onClick={reset}
                                className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
                            >
                                再来一张
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-6 gap-4 mx-auto max-w-sm">
                    {bubbles.map((popped, index) => (
                        <motion.button
                            key={index}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => popBubble(index)}
                            className={`aspect-square rounded-full shadow-inner relative transition-colors duration-200 ${popped ? 'bg-orange-200 shadow-none' : 'bg-orange-400 shadow-[inset_0_-4px_6px_rgba(0,0,0,0.2),0_4px_6px_rgba(0,0,0,0.1)]'
                                }`}
                        >
                            {!popped && (
                                <div className="absolute top-2 left-2 w-1/3 h-1/3 bg-white/40 rounded-full blur-[1px]" />
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BubbleWrap;
