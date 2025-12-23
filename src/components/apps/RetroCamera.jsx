import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, RefreshCw, Layers, Image as ImageIcon, Check, Trash2, Download, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * 赛博相机 (RetroCamera)
 * 支持拍立得、复古、黑白多种模式。
 * 拍摄的照片可以实时预览、保存到手机相册（本地存档），并支持设为主屏幕壁纸。
 */
const RetroCamera = ({ onClose, onSetWallpaper }) => {
    // 状态管理
    const [mode, setMode] = useState('polaroid'); // 'normal', 'polaroid', 'sketch', 'manga'
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('user');
    const [photos, setPhotos] = useState([]);
    const [capturedImage, setCapturedImage] = useState(null); // 刚拍完的确认页
    const [isShutterActive, setIsShutterActive] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false); // 相册开启状态
    const [viewingPhotoIndex, setViewingPhotoIndex] = useState(null); // 大图预览状态
    const [zoom, setZoom] = useState(1); // 缩放比例
    const [lastPinchDist, setLastPinchDist] = useState(0); // 用于计算缩放的手指初始距离
    const [polaroidEffect, setPolaroidEffect] = useState(() => localStorage.getItem('polaroid_effect') || 'none');
    const [sketchEffect, setSketchEffect] = useState(() => localStorage.getItem('sketch_effect') || 'none');
    const [mangaEffect, setMangaEffect] = useState(() => localStorage.getItem('manga_effect') || 'none');
    const [isEffectPickerOpen, setIsEffectPickerOpen] = useState(false);
    const [pickingFor, setPickingFor] = useState(null); // 'polaroid', 'sketch', 'manga'
    const [capabilities, setCapabilities] = useState(null); // 硬件能力 (包含 zoom)
    const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }
    const [confirmDialog, setConfirmDialog] = useState(null); // { title: string, message: string, onConfirm: function }
    const [viewingDirection, setViewingDirection] = useState(0); // 1 for next, -1 for prev
    const lastClickTime = useRef(0);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // 模式列表
    const MODES = [
        { id: 'normal', label: '系统' },
        { id: 'polaroid', label: '拍立得' },
        { id: 'sketch', label: '素描' },
        { id: 'manga', label: '漫画' }
    ];

    const SUB_EFFECTS = {
        polaroid: [
            { id: 'none', label: '经典白' },
            { id: 'vintage', label: '复古风' },
            { id: 'fresh', label: '清新风' },
            { id: 'dreamy', label: '梦幻风' },
            { id: 'warm', label: '温馨风' },
            { id: 'minimal', label: '简约风' }
        ],
        sketch: [
            { id: 'none', label: '原味' }
        ],
        manga: [
            { id: 'none', label: '原味' }
        ]
    };

    // 1. 初始化：加载历史照片
    useEffect(() => {
        const savedPhotos = localStorage.getItem('captured_photos');
        if (savedPhotos) setPhotos(JSON.parse(savedPhotos));
    }, []);

    // 2. 启动摄像头 (升级版：请求高分辨率与检测能力)
    const startCamera = async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 4096 }, // 尝试请求 4K
                    height: { ideal: 2160 }
                },
                audio: false
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);

            // 检测视频轨道能力 (硬件变焦等)
            const videoTrack = mediaStream.getVideoTracks()[0];
            if (videoTrack && videoTrack.getCapabilities) {
                const caps = videoTrack.getCapabilities();
                setCapabilities(caps);
                console.log("Camera Capabilities:", caps);
            }

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access denied:", err);
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (!isGalleryOpen && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [facingMode, isGalleryOpen, capturedImage]); // Re-start when simplified

    // --- 手势缩放处理 (Pinch to Zoom) ---
    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            setLastPinchDist(dist);
        }
    };

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && lastPinchDist > 0) {
            const dist = Math.hypot(
                e.touches[0].pageX - e.touches[1].pageX,
                e.touches[0].pageY - e.touches[1].pageY
            );
            const delta = (dist - lastPinchDist) / 100; // 缩放灵敏度
            setZoom(prev => Math.min(5, Math.max(1, prev + delta)));
            setLastPinchDist(dist);
        }
    };

    const handleTouchEnd = () => {
        setLastPinchDist(0);
    };

    // 应用硬件缩放 (如果支持)
    useEffect(() => {
        if (stream && capabilities?.zoom) {
            const track = stream.getVideoTracks()[0];
            if (track) {
                const zMin = capabilities.zoom.min || 1;
                const zMax = capabilities.zoom.max || 5;
                const targetZoom = Math.min(zMax, Math.max(zMin, zoom));
                track.applyConstraints({ advanced: [{ zoom: targetZoom }] })
                    .catch(e => console.error("Hardware zoom failed:", e));
            }
        }
    }, [zoom, stream, capabilities]);

    // --- 拦截物理返回键 ---
    useEffect(() => {
        const handleBack = (e) => {
            // 如果处于任何子视图，拦截并返回上一级
            if (viewingPhotoIndex !== null) {
                e.preventDefault();
                setViewingPhotoIndex(null);
            } else if (isGalleryOpen) {
                e.preventDefault();
                setIsGalleryOpen(false);
            } else if (capturedImage) {
                e.preventDefault();
                setCapturedImage(null);
            }
        };
        window.addEventListener('appBackButtonPressed', handleBack);
        return () => window.removeEventListener('appBackButtonPressed', handleBack);
    }, [isGalleryOpen, viewingPhotoIndex, capturedImage]);

    // 模式切换与双击识别
    const handleModeClick = (newMode) => {
        const now = Date.now();
        const CLICK_GAP = 300; // 双击判定间隔 (ms)

        if (now - lastClickTime.current < CLICK_GAP && mode === newMode) {
            // 是双击，且在当前选中的模式上双击
            if (['polaroid', 'sketch', 'manga'].includes(newMode)) {
                setPickingFor(newMode);
                setIsEffectPickerOpen(true);
                playSound('1.mp3');
            }
        } else {
            // 单击：仅仅切换模式
            setMode(newMode);
            playSound('1.mp3');
        }
        lastClickTime.current = now;
    };

    // 切换前后摄像头
    const toggleFacingMode = () => {
        playSound('1.mp3');
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    // 3.获取滤镜样式 (用于预览 - 近似效果)
    const getFilterStyle = () => {
        // 如果硬件支持 zoom 并已应用，则预览视频本身已经放大，无需 CSS scale
        const hasHardwareZoom = capabilities?.zoom && stream;
        const baseStyle = {
            transform: hasHardwareZoom ? 'scale(1)' : `scale(${zoom})`,
            transition: 'transform 0.3s ease-out'
        };

        let activeFilter = mode;
        if (mode === 'polaroid' && polaroidEffect !== 'none') activeFilter = polaroidEffect;
        if (mode === 'sketch' && sketchEffect !== 'none') activeFilter = sketchEffect;
        if (mode === 'manga' && mangaEffect !== 'none') activeFilter = mangaEffect;

        switch (activeFilter) {
            // --- 素描类 (灰度/高反差) ---
            case 'sketch':
            case 'none':
                if (mode === 'sketch') return { ...baseStyle, filter: 'grayscale(100%) contrast(150%) brightness(105%)' };
                if (mode === 'manga') return { ...baseStyle, filter: 'saturate(1.4) contrast(1.1) brightness(1.1)' };
                return baseStyle;


            // --- 拍立得变体 ---
            case 'vintage': return { ...baseStyle, filter: 'sepia(0.5) contrast(0.9) brightness(0.9) saturate(0.8) blur(0.5px)' };
            case 'fresh': return { ...baseStyle, filter: 'saturate(1.5) brightness(1.1) contrast(1.1) hue-rotate(-10deg)' };
            case 'dreamy': return { ...baseStyle, filter: 'brightness(1.1) contrast(0.8) saturate(0.9) hue-rotate(10deg) blur(1px)' };
            case 'warm': return { ...baseStyle, filter: 'sepia(0.2) saturate(1.4) brightness(1.0) contrast(0.9)' };
            case 'minimal': return { ...baseStyle, filter: 'contrast(1.2) saturate(0.7) brightness(1.1)' };

            default: return baseStyle;
        }
    };

    /**
     * 核心算法：像素级滤镜处理
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} width 
     * @param {number} height 
     */
    const applyPixelFilter = (ctx, width, height) => {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const total = data.length;

        // --- 获取当前实际应用的滤镜模式 ---
        let effectiveMode = mode;
        if (mode === 'polaroid') {
            effectiveMode = polaroidEffect;
        } else if (mode === 'sketch') {
            effectiveMode = 'sketch';
        } else if (mode === 'manga') {
            effectiveMode = 'manga';
        }

        // --- 拍立得特定像素处理 ---
        if (mode === 'polaroid') {
            for (let i = 0; i < total; i += 4) {
                let r = data[i], g = data[i + 1], b = data[i + 2];

                if (effectiveMode === 'vintage') {
                    // 复古：偏棕黄，低对比
                    r = r * 0.9 + 20; g = g * 0.8 + 10; b = b * 0.7;
                    r = Math.min(255, r * 1.1);
                } else if (effectiveMode === 'fresh') {
                    // 清新：高亮度，高饱和，偏蓝
                    r *= 1.1; g *= 1.1; b *= 1.25;
                } else if (effectiveMode === 'dreamy') {
                    // 梦幻：高亮度，低对比，偏蓝紫
                    r = r * 0.8 + 50; g = g * 0.8 + 50; b = b * 1.0 + 30;
                } else if (effectiveMode === 'warm') {
                    // 温馨：偏红橙，柔和
                    r = r * 1.1 + 10; g = g * 0.95 + 5; b *= 0.9;
                } else if (effectiveMode === 'minimal') {
                    // 简约：干脆，略微降低饱和
                    const gray = r * 0.3 + g * 0.59 + b * 0.11;
                    r = r * 0.7 + gray * 0.3;
                    g = g * 0.7 + gray * 0.3;
                    b = b * 0.7 + gray * 0.3;
                }

                // 通用基础优化：轻微褪色与颗粒
                const noise = (Math.random() - 0.5) * 15;
                data[i] = Math.min(255, Math.max(0, r * 0.95 + 5 + noise));
                data[i + 1] = Math.min(255, Math.max(0, g * 0.95 + 5 + noise));
                data[i + 2] = Math.min(255, Math.max(0, b * 0.95 + 5 + noise));
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // === 专业艺术素描：极致笔法 (Hatching, Stippling, Charcoal) + 康颂纸纹理 ===
        if (effectiveMode === 'sketch') {
            // 1. 深度灰度与结构提炼
            const gray = new Uint8ClampedArray(width * height);
            for (let i = 0; i < total; i += 4) {
                // 使用感知对比逻辑增强灰度
                const r = data[i], g = data[i + 1], b = data[i + 2];
                let val = r * 0.299 + g * 0.587 + b * 0.114;
                // 增强明暗对比 (Chiaroscuro)
                val = val < 128 ? (val * val) / 128 : 255 - ((255 - val) * (255 - val) / 128);
                gray[i / 4] = val;
            }

            // 2. 轮廓勾勒 (Contour Drawing) 与 结构检测
            const edges = new Uint8ClampedArray(width * height);
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = y * width + x;
                    const gx = -gray[(y - 1) * width + (x - 1)] + gray[(y - 1) * width + (x + 1)]
                        - 2 * gray[y * width + (x - 1)] + 2 * gray[y * width + (x + 1)]
                        - gray[(y + 1) * width + (x - 1)] + gray[(y + 1) * width + (x + 1)];
                    const gy = -gray[(y - 1) * width + (x - 1)] - 2 * gray[(y - 1) * width + x] - gray[(y - 1) * width + (x + 1)]
                        + gray[(y + 1) * width + (x - 1)] + 2 * gray[(y + 1) * width + x] + gray[(y + 1) * width + (x + 1)];
                    edges[idx] = Math.sqrt(gx * gx + gy * gy);
                }
            }

            // 3. 绘制底色：康颂纸 (Canson Paper) 质感
            ctx.fillStyle = '#f5f2e9'; // 微微泛黄的速写纸
            ctx.fillRect(0, 0, width, height);

            // 叠加石墨颗粒感 (Graphite Grain)
            const paperData = ctx.getImageData(0, 0, width, height);
            const pd = paperData.data;
            for (let i = 0; i < pd.length; i += 4) {
                const noise = (Math.random() - 0.5) * 12;
                pd[i] += noise; pd[i + 1] += noise; pd[i + 2] += noise;
            }
            ctx.putImageData(paperData, 0, 0);

            // 4. 程序化笔触渲染 (Extreme Strokes)
            const step = width > 2000 ? 12 : 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let y = 0; y < height; y += step) {
                for (let x = 0; x < width; x += step) {
                    const idx = y * width + x;
                    const gVal = gray[idx];
                    const eVal = edges[idx];

                    // --- A. 点画法 (Stippling)：亮部细节 ---
                    if (gVal > 200 && gVal < 240 && Math.random() > 0.7) {
                        ctx.fillStyle = 'rgba(60, 60, 60, 0.3)';
                        ctx.beginPath();
                        ctx.arc(x + Math.random() * step, y + Math.random() * step, 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // --- B. 十字排线 (Cross-hatching)：灰部体积感 ---
                    if (gVal < 180) {
                        ctx.strokeStyle = `rgba(40, 40, 40, ${0.4 * (1 - gVal / 180)})`;
                        ctx.lineWidth = width > 2000 ? 1 : 0.5;
                        ctx.beginPath();
                        const jitter = (Math.random() - 0.5) * step * 0.4;
                        ctx.moveTo(x + jitter, y);
                        ctx.lineTo(x + step + jitter, y + step);
                        ctx.stroke();

                        if (gVal < 100) {
                            ctx.beginPath();
                            ctx.moveTo(x + step + jitter, y);
                            ctx.lineTo(x + jitter, y + step);
                            ctx.stroke();
                        }
                    }

                    // --- C. 炭笔质感 (Charcoal Smudging)：暗部与乱线条 ---
                    if (gVal < 50) {
                        ctx.strokeStyle = `rgba(10, 10, 10, ${0.6 * (1 - gVal / 50)})`;
                        ctx.lineWidth = width > 2000 ? 3 : 1.5;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.bezierCurveTo(x + step, y, x, y + step, x + step, y + step);
                        ctx.stroke();
                    }

                    // --- D. 轮廓强化 (Bold Contour) ---
                    if (eVal > 60) {
                        ctx.strokeStyle = `rgba(0, 0, 0, ${Math.min(0.8, eVal / 100)})`;
                        ctx.lineWidth = width > 2000 ? 2 : 1;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + step * 0.5, y + step * 0.5);
                        ctx.stroke();
                    }
                }
            }
        }

        // === 专业艺术漫画：现代商业渲染 (Cel Shading, Rim Lighting, Bloom) ===
        else if (effectiveMode === 'manga') {
            // 1. 颜色工程：赛璐璐上色 (Cel Shading) 与 超级饱和
            for (let i = 0; i < total; i += 4) {
                let r = data[i], g = data[i + 1], b = data[i + 2];

                // 1.1 极致饱和度提升
                const avg = (r + g + b) / 3;
                r = avg + (r - avg) * 2.2;
                g = avg + (g - avg) * 2.2;
                b = avg + (b - avg) * 2.2;

                // 1.2 赛璐璐分层 (Cel Levels)
                const levels = 4;
                r = Math.floor(r / (256 / levels)) * (256 / levels);
                g = Math.floor(g / (256 / levels)) * (256 / levels);
                b = Math.floor(b / (256 / levels)) * (256 / levels);

                data[i] = Math.min(255, r);
                data[i + 1] = Math.min(255, g);
                data[i + 2] = Math.min(255, b);
            }
            ctx.putImageData(imageData, 0, 0);

            // 2. 结构提取：动态勾边 (Varying Line Weight) 与 轮廓光 (Rim Light)
            const edgeCanvas = document.createElement('canvas');
            edgeCanvas.width = width; edgeCanvas.height = height;
            const eCtx = edgeCanvas.getContext('2d');
            eCtx.drawImage(ctx.canvas, 0, 0);
            const eData = eCtx.getImageData(0, 0, width, height).data;

            // 3. 细节合成 (Compositing)
            const gridSize = width > 2000 ? 12 : 6;

            for (let y = 0; y < height; y += gridSize) {
                for (let x = 0; x < width; x += gridSize) {
                    const idx = (y * width + x) * 4;
                    const r = eData[idx], g = eData[idx + 1], b = eData[idx + 2];
                    const br = (r + g + b) / 3;

                    // --- A. 极致网点 (Halftone Patterns) ---
                    if (br < 140) {
                        const radius = (1 - br / 255) * (gridSize / 2) * 1.1;
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                        ctx.beginPath();
                        ctx.arc(x + gridSize / 2, y + gridSize / 2, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // --- B. 动态墨迹勾边 (Bold Ink Outlines) ---
                    const dR = Math.abs(eData[idx] - eData[idx + 4]) + Math.abs(eData[idx + 1] - eData[idx + 5]);
                    const dB = Math.abs(eData[idx] - eData[idx + width * 4]) + Math.abs(eData[idx + 1] - eData[idx + width * 4 + 1]);
                    if (dR > 80 || dB > 80) {
                        ctx.fillStyle = 'black';
                        // 根据边缘强度模拟压感粗细
                        const weight = Math.min(gridSize, (dR + dB) / 100 * (width > 2000 ? 4 : 2));
                        ctx.fillRect(x, y, weight, weight);
                    }

                    // --- C. 轮廓光 (Rim Lighting) 模拟 ---
                    // 在极暗背景下的亮部边缘增加溢光
                    if (br > 200 && (x < 20 || x > width - 20 || y < 20 || y > height - 20)) {
                        ctx.shadowBlur = 15;
                        ctx.shadowColor = 'white';
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x, y, gridSize, gridSize);
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // 4. 后期特效：轻微溢光 (Bloom)
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.15;
            ctx.drawImage(ctx.canvas, 0, 0); // 自叠加产生柔光
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
        }
    };

    // 4. 拍照核心逻辑
    const takePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        setIsShutterActive(true);
        playSound('1.mp3');
        setTimeout(() => setIsShutterActive(false), 200);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // 开启最高清晰度渲染
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 检测当前是否使用了硬件缩放
        const hasHardwareZoom = capabilities?.zoom && stream;

        // 绘制原图
        if (hasHardwareZoom) {
            // 如果是硬件变焦，视频流已经是放大后的，直接全屏绘制
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        } else {
            // 传统数字变焦：手动裁切中心
            const sw = video.videoWidth / zoom;
            const sh = video.videoHeight / zoom;
            const sx = (video.videoWidth - sw) / 2;
            const sy = (video.videoHeight - sh) / 2;
            ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        }

        // 拍立得色彩处理 (简单滤镜)
        if (mode === 'polaroid') {
            ctx.filter = 'sepia(30%) contrast(110%) brightness(110%)';
            if (hasHardwareZoom) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            } else {
                const sw = video.videoWidth / zoom;
                const sh = video.videoHeight / zoom;
                const sx = (video.videoWidth - sw) / 2;
                const sy = (video.videoHeight - sh) / 2;
                ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
            }
            ctx.filter = 'none';
        }

        // 高级像素处理 (素描/漫画/各种幻想效果)
        const hasPixelFilter = mode === 'sketch' || mode === 'manga' ||
            (mode === 'polaroid' && polaroidEffect !== 'none') ||
            (mode === 'sketch' && sketchEffect !== 'none') ||
            (mode === 'manga' && mangaEffect !== 'none');
        if (hasPixelFilter) {
            applyPixelFilter(ctx, canvas.width, canvas.height);
        }

        let finalDataUrl;

        const isFantasyMode = ['soul', 'neon', 'candy', 'abyssal', 'glitch', 'thermal', 'fungi', 'prism', 'noir', 'weathering', 'polaroid'].includes(mode);

        // 拍立得效果：根据子选项生成各种变异边框
        if (mode === 'polaroid') {
            const frameCanvas = document.createElement('canvas');
            const fCtx = frameCanvas.getContext('2d');
            const padding = canvas.width * 0.08;
            const bottomSpace = canvas.width * 0.28;

            frameCanvas.width = canvas.width + padding * 2;
            frameCanvas.height = canvas.height + padding + bottomSpace;
            const fw = frameCanvas.width;
            const fh = frameCanvas.height;

            const effect = polaroidEffect;

            // 1. 基础背景绘制
            // 1. 基础背景绘制 (经典自尊白)
            fCtx.fillStyle = '#fdfdfd';
            fCtx.fillRect(0, 0, fw, fh);

            // 风格特定背景/边框装饰
            if (effect === 'vintage') {
                // 复古：微微泛黄的旧纸感
                fCtx.fillStyle = 'rgba(255, 200, 50, 0.05)';
                fCtx.fillRect(0, 0, fw, fh);
                // 模拟漏光效果
                const grd = fCtx.createLinearGradient(0, 0, fw, 0);
                grd.addColorStop(0, 'rgba(255, 50, 0, 0)');
                grd.addColorStop(0.5, 'rgba(255, 50, 0, 0.1)');
                grd.addColorStop(1, 'rgba(255, 50, 0, 0)');
                fCtx.fillStyle = grd;
                fCtx.fillRect(0, 0, fw, fh);
            } else if (effect === 'fresh') {
                // 清新：极致洁白，带一点点光泽
                fCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                fCtx.shadowBlur = 20;
                fCtx.shadowColor = 'rgba(255, 255, 255, 0.5)';
                fCtx.strokeRect(padding / 2, padding / 2, fw - padding, fh - padding);
                fCtx.shadowBlur = 0;
            } else if (effect === 'dreamy') {
                // 梦幻：柔和蓝边框
                fCtx.fillStyle = 'rgba(0, 150, 255, 0.03)';
                fCtx.fillRect(0, 0, fw, fh);
            } else if (effect === 'warm') {
                // 温馨：由于像素处理已偏暖，此处加一个淡淡的橙色晕染
                fCtx.fillStyle = 'rgba(255, 100, 0, 0.02)';
                fCtx.fillRect(0, 0, fw, fh);
            }

            // 2. 绘制相片主体
            fCtx.drawImage(canvas, padding, padding);

            // 3. 细节装饰：颗粒与物理真实感
            fCtx.globalAlpha = 0.03;
            fCtx.fillStyle = '#000';
            for (let i = 0; i < fw; i += 5) fCtx.fillRect(i, 0, 1, fh); // 细微扫描线
            fCtx.globalAlpha = 1.0;

            // 给照片本体加一个非常细的灰色描边，模拟纸张边缘
            fCtx.strokeStyle = 'rgba(0,0,0,0.1)';
            fCtx.lineWidth = 1;
            fCtx.strokeRect(padding, padding, canvas.width, canvas.height);

            // 3. 全局纹理覆盖 (所有变异增加一张颗粒感网格)
            fCtx.globalAlpha = 0.05;
            fCtx.fillStyle = '#000';
            for (let i = 0; i < fw; i += 4) fCtx.fillRect(i, 0, 1, fh);
            fCtx.globalAlpha = 1.0;

            finalDataUrl = frameCanvas.toDataURL('image/jpeg', 0.85);
        } else {
            finalDataUrl = canvas.toDataURL('image/jpeg', 0.90);
        }

        setCapturedImage(finalDataUrl);
    };

    // 保存
    const savePhoto = async () => {
        if (!capturedImage) return;
        playSound('1.mp3');

        // 1. 保存到应用内部相册 (localStorage)
        const newPhotos = [capturedImage, ...photos].slice(0, 40);
        setPhotos(newPhotos);
        localStorage.setItem('captured_photos', JSON.stringify(newPhotos));

        // 2. 原生保存逻辑 (Capacitor)
        if (Capacitor.isNativePlatform()) {
            try {
                const fileName = `CyberPhoto_${Date.now()}.jpg`;
                // 写入物理文件 (这是判定成功的核心标准)
                await Filesystem.writeFile({
                    path: fileName,
                    data: capturedImage.split(',')[1],
                    directory: Directory.Documents,
                });

                // 一旦写入成功，立即显示成功反馈
                showToast('✨ 已成功保存到系统文档！', 'success');
                setCapturedImage(null); // 提前清除预览，提升响应感

                // 异步唤起分享，不再等待其结果，也不再捕获其取消异常
                Share.share({
                    title: '保存我的赛博瞬间',
                    url: capturedImage,
                    dialogTitle: '保存到相册或分享',
                }).catch(e => console.debug("Share closed or failed:", e));

            } catch (err) {
                console.error("Save failed:", err);
                showToast('保存失败，请检查存储权限', 'error');
            }
        } else {
            // Web 预览模式降级逻辑
            const link = document.createElement('a');
            link.href = capturedImage;
            link.download = `cyber-photo-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        setCapturedImage(null);
    };

    // 删除照片
    const deletePhoto = (index) => {
        setConfirmDialog({
            title: '删除照片',
            message: '这张珍贵的赛博瞬间将永久消失，确定吗？',
            onConfirm: () => {
                playSound('1.mp3');
                const newPhotos = photos.filter((_, i) => i !== index);
                setPhotos(newPhotos);
                localStorage.setItem('captured_photos', JSON.stringify(newPhotos));
                if (viewingPhotoIndex === index) setViewingPhotoIndex(null);
                setConfirmDialog(null);
                showToast('照片已移出相册', 'info');
            }
        });
    };

    // 显示 Toast
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="h-full bg-black flex flex-col text-white overflow-hidden relative">

            {/* 退出按钮 */}
            <button onClick={onClose} className="absolute top-9 left-6 z-20 p-3 bg-black/20 backdrop-blur-md rounded-full active:scale-90 transition-all border border-white/10">
                <ArrowLeft size={24} />
            </button>

            {/* --- 闪光 --- */}
            <AnimatePresence>
                {isShutterActive && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white z-[100] pointer-events-none" />
                )}
            </AnimatePresence>

            {/* --- 取景器 Main View (支持手势变焦) --- */}
            <div
                className="flex-1 relative flex items-center justify-center bg-zinc-900 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <video
                    ref={videoRef} autoPlay playsInline
                    style={getFilterStyle()}
                    className="w-full h-full object-cover transition-transform duration-200"
                />

                {/* 变焦倍率显示 */}
                {zoom > 1 && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-yellow-400 font-black text-xs shadow-2xl animate-in fade-in zoom-in duration-300">
                        {zoom.toFixed(1)}x
                    </div>
                )}

                {/* 辅助线 */}
                {mode === 'normal' && (
                    <div className="absolute inset-0 pointer-events-none opacity-20 grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-white/50" />
                        <div className="border-r border-white/50" />
                        <div />
                        <div className="border-t border-white/50 col-span-3" />
                        <div className="border-t border-white/50 col-span-3" />
                    </div>
                )}
            </div>

            {/* --- 底部控制区 (透明悬浮) --- */}
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end pb-8 z-10 px-8">

                {/* 模式选择滑块 */}
                <div className="flex gap-8 items-center mb-6 px-4 overflow-hidden justify-center relative">
                    {MODES.map(m => (
                        <button
                            key={m.id}
                            onClick={() => handleModeClick(m.id)}
                            className={`text-sm font-bold transition-all duration-300 flex-shrink-0 relative ${mode === m.id ? 'text-yellow-400 scale-110' : 'text-white/40'}`}
                            style={{ textShadow: mode === m.id ? '0 0 10px rgba(250, 204, 21, 0.5)' : 'none' }}
                        >
                            {m.label}
                            {((m.id === 'polaroid' && polaroidEffect !== 'none') ||
                                (m.id === 'sketch' && sketchEffect !== 'none') ||
                                (m.id === 'manga' && mangaEffect !== 'none')) && (
                                    <div className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
                                )}
                        </button>
                    ))}
                </div>

                {/* 拍立得子特效选择器 */}
                <AnimatePresence>
                    {isEffectPickerOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute bottom-32 left-8 right-8 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 z-50 shadow-2xl"
                        >
                            <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 text-center">
                                选择 {MODES.find(m => m.id === pickingFor)?.label} 效果
                            </div>
                            <div className="grid grid-cols-3 gap-3 max-h-56 overflow-y-auto no-scrollbar p-1">
                                {pickingFor && SUB_EFFECTS[pickingFor]?.map(effect => {
                                    const isActive = pickingFor === 'polaroid' ? polaroidEffect === effect.id :
                                        pickingFor === 'sketch' ? sketchEffect === effect.id :
                                            mangaEffect === effect.id;
                                    return (
                                        <button
                                            key={effect.id}
                                            onClick={() => {
                                                if (pickingFor === 'polaroid') {
                                                    setPolaroidEffect(effect.id);
                                                    localStorage.setItem('polaroid_effect', effect.id);
                                                } else if (pickingFor === 'sketch') {
                                                    setSketchEffect(effect.id);
                                                    localStorage.setItem('sketch_effect', effect.id);
                                                    setMode('sketch');
                                                } else if (pickingFor === 'manga') {
                                                    setMangaEffect(effect.id);
                                                    localStorage.setItem('manga_effect', effect.id);
                                                    setMode('manga');
                                                }
                                                setIsEffectPickerOpen(false);
                                                playSound('1.mp3');
                                            }}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${isActive ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                        >
                                            <div className="text-[10px] font-bold text-center leading-tight">{effect.label}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => setIsEffectPickerOpen(false)}
                                className="w-full mt-4 py-2 text-xs font-bold text-white/20 hover:text-white/40 border-t border-white/5"
                            >
                                取消
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 核心操作栏 */}
                <div className="flex items-center justify-between">
                    {/* 左侧：切换摄像头 */}
                    <button onClick={toggleFacingMode} className="p-3 bg-white/10 rounded-full active:rotate-180 transition-all">
                        <RefreshCw size={24} />
                    </button>

                    {/* 中间：快门 */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={takePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm"
                    >
                        <div className={`w-16 h-16 rounded-full ${mode === 'normal' ? 'bg-white' : 'bg-red-500'} transition-colors duration-300`} />
                    </motion.button>

                    {/* 右侧：相册入口 (缩略图) */}
                    <button
                        onClick={() => { setIsGalleryOpen(true); playSound('1.mp3'); }}
                        className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden bg-zinc-800 active:scale-95 transition-all"
                    >
                        {photos.length > 0 ? (
                            <img src={photos[0]} className="w-full h-full object-cover" alt="最新" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center aspect-square"><ImageIcon size={20} className="text-white/30" /></div>
                        )}
                    </button>
                </div>
            </div>

            {/* --- 相册覆盖层 (Simplified Gallery) --- */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 20 }} className="absolute inset-0 z-40 bg-zinc-950 flex flex-col">
                        <div className="pt-10 pb-4 px-4 flex items-center justify-between bg-zinc-900 border-b border-zinc-800">
                            <button onClick={() => setIsGalleryOpen(false)} className="flex items-center gap-2 text-white/60"><ArrowLeft size={20} /> 返回相机</button>
                            <h2 className="font-black text-lg tracking-widest text-white">所有照片</h2>
                            <div className="w-20" />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-1">
                            {photos.length === 0 && <div className="col-span-3 text-center text-white/20 mt-20">暂无照片</div>}
                            {photos.map((url, index) => (
                                <div key={index} onClick={() => setViewingPhotoIndex(index)} className="aspect-square bg-zinc-800 overflow-hidden relative">
                                    <img src={url} className="w-full h-full object-cover" loading="lazy" />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- 大图预览 (支持左右滑动) --- */}
            {viewingPhotoIndex !== null && (
                <div className="absolute inset-0 z-50 bg-black overflow-hidden">
                    <AnimatePresence initial={false} custom={viewingDirection}>
                        <motion.div
                            key={viewingPhotoIndex}
                            custom={viewingDirection}
                            variants={{
                                enter: (direction) => ({ x: direction > 0 ? '100vw' : direction < 0 ? '-100vw' : 0, opacity: 0.5, scale: 0.95 }),
                                center: { x: 0, opacity: 1, scale: 1 },
                                exit: (direction) => ({ x: direction < 0 ? '100vw' : direction > 0 ? '-100vw' : 0, opacity: 0.5, scale: 0.95 })
                            }}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset }) => {
                                const swipe = offset.x;
                                if (swipe < -100 && viewingPhotoIndex < photos.length - 1) {
                                    setViewingDirection(1);
                                    setViewingPhotoIndex(viewingPhotoIndex + 1);
                                    playSound('1.mp3');
                                } else if (swipe > 100 && viewingPhotoIndex > 0) {
                                    setViewingDirection(-1);
                                    setViewingPhotoIndex(viewingPhotoIndex - 1);
                                    playSound('1.mp3');
                                }
                            }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-0 touch-none"
                        >
                            <img src={photos[viewingPhotoIndex]} className="w-full flex-1 object-contain pointer-events-none" />

                            <div className="absolute top-10 left-4">
                                <button onClick={() => { setViewingDirection(0); setViewingPhotoIndex(null); }} className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white active:scale-90 transition-all border border-white/10"><ArrowLeft size={24} /></button>
                            </div>

                            {/* 指示器 */}
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white/40 border border-white/5">
                                {viewingPhotoIndex + 1} / {photos.length}
                            </div>

                            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-12">
                                <button onClick={() => { onSetWallpaper(photos[viewingPhotoIndex]); showToast('✨ 壁纸设置成功！', 'success'); }} className="flex flex-col items-center gap-1 text-white/80 active:scale-90 transition-all">
                                    <Monitor size={24} /> <span className="text-[10px]">设为壁纸</span>
                                </button>
                                <button onClick={() => deletePhoto(viewingPhotoIndex)} className="flex flex-col items-center gap-1 text-red-500 active:scale-90 transition-all">
                                    <Trash2 size={24} /> <span className="text-[10px]">删除照片</span>
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* --- 拍摄确认页 (Review) --- */}
            <AnimatePresence>
                {capturedImage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
                        <div className="flex-1 w-full flex items-center justify-center p-8">
                            <div className={`relative ${mode === 'polaroid' ? 'shadow-2xl' : ''}`}>
                                <img src={capturedImage} className="max-w-full max-h-[70vh] object-contain" />
                            </div>
                        </div>
                        <div className="h-32 w-full flex items-center justify-evenly bg-black pb-8">
                            <button onClick={() => setCapturedImage(null)} className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-white"><ArrowLeft size={28} /></button>
                            <button onClick={savePhoto} className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-black shadow-lg shadow-yellow-400/20"><Check size={40} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <canvas ref={canvasRef} className="hidden" />

            {/* --- 全局 Toast 提示 --- */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-1/2 z-[200] px-6 py-3 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full shadow-2xl flex items-center gap-3"
                    >
                        <div className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-green-400' : toast.type === 'error' ? 'bg-red-400' : 'bg-yellow-400'} animate-pulse`} />
                        <span className="text-sm font-bold text-white tracking-wide">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- 精美确认弹窗 --- */}
            <AnimatePresence>
                {confirmDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex items-center justify-center px-8 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-sm bg-zinc-900/90 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 overflow-hidden relative shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                            <h3 className="text-xl font-black mb-2 text-white">{confirmDialog.title}</h3>
                            <p className="text-white/60 text-sm leading-relaxed mb-8">{confirmDialog.message}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmDialog(null)}
                                    className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 font-bold active:scale-95 transition-all"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={confirmDialog.onConfirm}
                                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    确定删除
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export default RetroCamera;
