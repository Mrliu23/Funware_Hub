/**
 * 简单的音频播放工具
 * 自动处理并发播放和错误捕获，并支持全局停止
 */

// 全局活跃音频集合
const activeSounds = new Set();

/**
 * 播放一次性音效
 * @param {string} filename 
 * @returns {Audio} 返回音频对象实例
 */
export const playSound = (filename) => {
    try {
        const audio = new Audio(`/sounds/${filename}`);
        audio.volume = 0.6; // 默认音量

        // 注册到全局集合
        activeSounds.add(audio);

        // 播放结束或出错时移除
        audio.onended = () => activeSounds.delete(audio);
        audio.onerror = () => activeSounds.delete(audio);

        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`音频播放失败 (${filename}):`, error);
                activeSounds.delete(audio);
            });
        }

        return audio;
    } catch (err) {
        console.error("音频系统错误:", err);
        return null;
    }
};

/**
 * 停止所有当前正在播放的声音（包括背景音和一次性音效）
 */
export const stopAllSounds = () => {
    activeSounds.forEach(audio => {
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch (e) {
            console.warn("停止音频失败:", e);
        }
    });
    activeSounds.clear();
};

// 用于循环播放背景音的类
export class LoopSound {
    constructor(filename) {
        this.audio = new Audio(`/sounds/${filename}`);
        this.audio.loop = true;
        this.audio.volume = 0.3; // 背景音稍微小一点
    }

    play() {
        // 注册
        activeSounds.add(this.audio);

        this.audio.play().catch(e => {
            console.warn("背景音播放失败:", e);
            activeSounds.delete(this.audio);
        });
    }

    stop() {
        try {
            this.audio.pause();
            this.audio.currentTime = 0;
        } catch (e) { }
        activeSounds.delete(this.audio);
    }

    // 允许调整此实例的音量
    setVolume(vol) {
        this.audio.volume = Math.max(0, Math.min(1, vol));
    }
}
