import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Music } from 'lucide-react';
import { motion } from 'framer-motion';

// ==========================================
// 1. 在这里配置你的音频按钮列表
// ==========================================
// id: 唯一标识符，不要重复
// label: 按钮上显示的文字
// file: 音频文件名 (需要放在 public/sounds/ 目录下)
// color: 按钮的背景颜色 (Tailwind CSS 类名或 hex 颜色)
// emoji: 可选的图标/表情
const SOUND_BUTTONS = [
    { id: 'btn1', label: '功夫_星爷', file: '周星驰-功夫.mp3', color: 'bg-blue-500', emoji: '🎉' },
    { id: 'btn2', label: '别感冒', file: '坤坤别感冒.mp3', color: 'bg-blue-500', emoji: '🐔' },
    { id: 'btn3', label: '你怎么睡得着的', file: '你怎么睡得着的.mp3', color: 'bg-blue-500', emoji: '😅' },

    { id: 'btn4', label: '自私', file: '你怎么这么自私.mp3', color: 'bg-blue-500', emoji: '👋' },
    { id: 'btn5', label: '让我说话', file: '你让我说话不.mp3', color: 'bg-red-500', emoji: '🤬' },
    { id: 'btn6', label: '呸', file: '呸.mp3', color: 'bg-blue-500', emoji: '✅' },

    { id: 'btn7', label: '友商是傻逼', file: '友商是傻逼.mp3', color: 'bg-green-500', emoji: '🐵' },
    { id: 'btn8', label: '屌不屌', file: '屌不屌.mp3', color: 'bg-green-500', emoji: '🙈' },
    { id: 'btn9', label: '屌爆了', file: '屌爆了.mp3', color: 'bg-green-500', emoji: '🙉' },

    { id: 'btn10', label: '免费送', file: '免费送.mp3', color: 'bg-green-500', emoji: '🙊' },
    { id: 'btn11', label: '我真是楚楚baby', file: '我真是楚楚baby.mp3', color: 'bg-green-500', emoji: '🦊' },
    { id: 'btn12', label: 'MyEyes', file: 'lookinmyeyes.mp3', color: 'bg-green-500', emoji: '😬' },

    { id: 'btn13', label: '你的眼我的醋', file: '你的眼我的醋.mp3', color: 'bg-green-500', emoji: '🐴' },
    { id: 'btn14', label: '报告大帝', file: '报告大帝.mp3', color: 'bg-green-500', emoji: '' },
    { id: 'btn15', label: '报告将军', file: '报告将军.mp3', color: 'bg-orange-400', emoji: '🫡' },

    { id: 'btn16', label: '惊天噩耗', file: '惊天噩耗.mp3', color: 'bg-orange-400', emoji: '🤯' },
    { id: 'btn17', label: '花哥真情_啊~', file: '花哥真情_啊~.mp3', color: 'bg-orange-400', emoji: '🤩' },
    { id: 'btn18', label: '花哥真情_将军', file: '花哥真情_将军.mp3', color: 'bg-orange-400', emoji: '😭' },

    { id: 'btn19', label: '花哥真情_我们是第一世界强国', file: '花哥真情_我们是第一世界强国.mp3', color: 'bg-orange-400', emoji: '🍚' },
    { id: 'btn20', label: '花哥真情-完整~', file: '花哥真情-完整.mp3', color: 'bg-orange-400', emoji: '' },
    { id: 'btn21', label: '鸡汤来了', file: '鸡汤来了.mp3', color: 'bg-orange-400', emoji: '🍽️' },

    { id: 'btn22', label: '草', file: '草.mp3', color: 'bg-orange-400', emoji: '🥶' },
    { id: 'btn23', label: '我草', file: '我操.mp3', color: 'bg-orange-400', emoji: '🤪' },
    { id: 'btn24', label: '给傻子买瓜子去', file: '给傻子卖瓜子去.mp3', color: 'bg-purple-500', emoji: '🤡' },

    { id: 'btn25', label: '感恩楼盘', file: '感恩楼盘.mp3', color: 'bg-yellow-500', emoji: '🙂‍↕️' },
    { id: 'btn26', label: '全体起立', file: '全体起立.mp3', color: 'bg-green-500', emoji: '🧐' },
    { id: 'btn27', label: '跟我宣誓', file: '跟我宣誓.mp3', color: 'bg-green-500', emoji: '🤓' },

    { id: 'btn28', label: '干干净净', file: '干干净净.mp3', color: 'bg-yellow-500', emoji: '😻' },
    { id: 'btn29', label: '我叫铁林', file: '我叫铁林.mp3', color: 'bg-red-500', emoji: '😺' },
    { id: 'btn30', label: '你叫什么', file: '我叫铁林_你叫什么.mp3', color: 'bg-red-500', emoji: '😾' },

    { id: 'btn31', label: '哥哥', file: '我只会心疼哥哥_哥哥.mp3', color: 'bg-yellow-500', emoji: '🕊️' },
    { id: 'btn32', label: '我只会心疼哥哥', file: '我只会心疼哥哥.mp3', color: 'bg-yellow-500', emoji: '🦜' },
    { id: 'btn33', label: '', file: '1.mp3', color: 'bg-yellow-500', emoji: '' },

    { id: 'btn34', label: '坦克没有后视镜的', file: '坦克没有后视镜的.mp3', color: 'bg-purple-500', emoji: '🐛' },
    { id: 'btn35', label: '枪炮不长眼的', file: '枪炮是不长眼的.mp3', color: 'bg-blue-500', emoji: '🦇' },
    { id: 'btn36', label: '黑哥们的语言不通的', file: '黑哥们的语言是不通的.mp3', color: 'bg-purple-500', emoji: '🐜' },

    { id: 'btn37', label: '我死过', file: '我差点死过.mp3', color: 'bg-purple-500', emoji: '🪲' },
    { id: 'btn38', label: '我吃蚯蚓', file: '我吃蚯蚓.mp3', color: 'bg-purple-500', emoji: '🪱' },
    { id: 'btn39', label: '我会开飞机', file: '我会开飞机.mp3', color: 'bg-purple-500', emoji: '🐞' },

    { id: 'btn40', label: '我让坦克压过', file: '我让坦克压过.mp3', color: 'bg-purple-500', emoji: '🦂' },
    { id: 'btn41', label: '我坦克会飘逸', file: '我坦克飘逸.mp3', color: 'bg-orange-500', emoji: '🕷️' },
    { id: 'btn42', label: '我跳过楼', file: '我跳过楼你跳过吗.mp3', color: 'bg-purple-500', emoji: '🦠' },

    { id: 'btn43', label: '你是个嘚', file: '你是个嘚.mp3', color: 'bg-green-500', emoji: '😒' },
    { id: 'btn44', label: '嘚嘚', file: '嘚嘚.mp3', color: 'bg-green-500', emoji: '😏' },
    { id: 'btn45', label: '你看看你多没出息啊', file: '你看看你多没出息啊.mp3', color: 'bg-green-500', emoji: '🥸' },

    { id: 'btn46', label: '每天不知道在搞什么鬼', file: '每天不知道在搞什么鬼.mp3', color: 'bg-red-500', emoji: '🫨' },
    { id: 'btn47', label: '你昨晚跑哪去啦', file: '你昨晚跑哪去了.mp3', color: 'bg-red-500', emoji: '🏇' },
    { id: 'btn48', label: '他在耍你啊皇上', file: '他在耍你啊皇上.mp3', color: 'bg-green-500', emoji: '💂‍♂️' },

    { id: 'btn49', label: '米老鼠', file: '米老鼠.mp3', color: 'bg-red-500', emoji: '🐁' },
    { id: 'btn50', label: '萝卜', file: '萝卜.mp3', color: 'bg-purple-500', emoji: '🥕' },
    { id: 'btn51', label: '纸巾', file: '纸巾.mp3', color: 'bg-red-500', emoji: '🧻' },

    { id: 'btn52', label: '没座', file: '没座.mp3', color: 'bg-red-500', emoji: '💺' },
    { id: 'btn53', file: '真棒.mp3', color: 'bg-green-500', icon: '/icons/cat.ico' },
    { id: 'btn54', label: '顶尖', file: '顶尖.mp3', color: 'bg-green-500', emoji: '🎤' },



    // 你可以在这里继续添加很多按钮...
    // { id: 'btn7', label: '自定义', file: 'your_file.mp3', color: 'bg-purple-500', emoji: '🎵' },
];

/**
 * 热门梗图 (SoundBoard) 小程序
 * 这是一个点击按钮播放对应音频的面板，支持互斥播放（点新的会自动停止旧的）。
 */
const SoundBoard = ({ onClose }) => {
    // 状态：当前正在播放的音频ID
    const [playingId, setPlayingId] = useState(null);

    // 使用 useRef 来保持当前的 Audio 对象实例，避免重渲染导致丢失
    const audioRef = useRef(null);

    // 组件卸载时（退出应用时）停止播放
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    /**
     * 处理按钮点击事件
     * @param {Object} item - 按钮配置对象
     */
    const handlePlay = (item) => {
        // 如果点击的是当前正在播放的，则暂停/停止
        if (playingId === item.id) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0; // 重置进度
            }
            setPlayingId(null);
            return;
        }

        // 1. 停止当前正在播放的其他音频 (互斥逻辑)
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // 2. 创建新的音频实例并播放
        try {
            // 注意：音频文件必须放在 public/sounds_board/ 目录下
            const sound = new Audio(`/sounds_board/${item.file}`);

            // 设置音量
            sound.volume = 1.0;

            // 监听播放结束事件，自动重置状态
            sound.onended = () => {
                setPlayingId(null);
                audioRef.current = null;
            };

            // 监听错误
            sound.onerror = (e) => {
                console.error(`播放失败: ${item.file}`, e);
                setPlayingId(null);
                audioRef.current = null;
                // 可以在这里加一个简单的提示，如 alert('音频文件不存在');
            };

            // 开始播放
            sound.play().catch(e => {
                console.warn('播放被阻止或失败:', e);
                setPlayingId(null);
            });

            // 更新状态
            audioRef.current = sound;
            setPlayingId(item.id);

        } catch (err) {
            console.error("音频初始化失败:", err);
        }
    };

    return (
        <div className="h-full bg-slate-900 flex flex-col text-white">
            {/* --- 顶部导航栏 --- */}
            <div className="pt-10 pb-4 px-4 flex items-center gap-4 bg-slate-800 shadow-md z-10">
                <button
                    onClick={onClose}
                    className="p-2 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition-all"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Music size={20} className="text-purple-400" />
                        热梗音频
                    </h1>
                    <span className="text-xs text-slate-400">点击播放 · 再次点击停止</span>
                </div>
            </div>

            {/* --- 按钮网格区域 --- */}
            {/* overflow-y-auto 允许内容过多时滚动 */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-3 gap-4 pb-20">
                    {/* <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-20"></div> */}
                    {SOUND_BUTTONS.map((item) => {
                        const isPlaying = playingId === item.id;

                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => handlePlay(item)}
                                whileTap={{ scale: 0.95 }}
                                className={`
                                    relative overflow-hidden
                                    aspect-video rounded-xl shadow-lg border-b-4 border-black/20
                                    flex flex-col items-center justify-center gap-2
                                    transition-all duration-200
                                    ${item.color} 
                                    ${isPlaying ? 'ring-4 ring-white ring-opacity-50 brightness-110' : 'hover:brightness-105'}
                                `}
                            >
                                {/* 播放状态指示器 (波纹动画) */}
                                {isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                        <div className="w-full h-full bg-white animate-pulse" />
                                    </div>
                                )}

                                {/* 图标 */}
                                {/* 图标渲染区域 */}
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <div className="text-2xl filter drop-shadow-md z-10 flex items-center justify-center min-h-[40px]">
                                        {isPlaying ? (
                                            <Pause size={28} />
                                        ) : (
                                            item.icon ? (
                                                <img
                                                    src={item.icon}
                                                    alt={item.label}
                                                    className="w-10 h-10 object-contain block"
                                                    onError={(e) => {
                                                        console.error("图片加载失败，请检查 public 文件夹:", item.icon);
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-2xl">{item.emoji || <Play size={20} />}</span>
                                            )
                                        )}
                                    </div>

                                    {/* 记得把文字标签加回来，否则按钮是空的 */}
                                    <span className="font-bold text-[10px] text-center leading-tight opacity-90">
                                        {item.label}
                                    </span>
                                </div>

                            </motion.button>
                        );
                    })}

                    {/* 添加新按钮的占位符提示 (方便你自己看到哪里加)
                    <div className="col-span-2 sm:col-span-3 border-2 border-dashed border-slate-700 rounded-xl p-4 flex flex-col items-center justify-center text-slate-500 gap-2 mt-4">
                        <span className="text-sm">在代码 SOUND_BUTTONS 数组中添加更多...</span>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default SoundBoard;
