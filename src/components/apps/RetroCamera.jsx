import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Camera, RefreshCw, Layers, Image as ImageIcon, Check, Trash2, Download, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * 赛博相机 (RetroCamera)
 * 支持拍立得、复古、黑白多种模式。
 * 拍摄的照片可以实时预览、保存到手机相册（本地存档），并支持设为主屏幕壁纸。
 */
// 色彩工具：RGB <-> HSL 转换，避免直接按通道线性拉伸导致颜色失真
function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}
function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
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
    const [isProcessing, setIsProcessing] = useState(false); // 处理中状态
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
            { id: 'saturated', label: '高饱和' },     // high-saturation (用户要求的“高饱和”)
            { id: 'lightleak', label: '漏光效果' },  // light-leak (用户要求的“漏光”)
            { id: 'warm', label: '温馨风' },
            { id: 'minimal', label: '简约风' }
        ],
        sketch: [
            { id: 'none', label: '原味' }
        ],
        manga: [
            { id: 'none', label: '原味' },
            { id: 'sample', label: '样例' }
        ]
    };

    // 懒加载图片组件：使用 IntersectionObserver 按需加载本地资源，支持原生 convertFileSrc 与 Web 回退
    const LazyImg = ({ id, className = '', alt = '', onClick, eager = false }) => {
        const [src, setSrc] = useState(null);
        const [status, setStatus] = useState('idle'); // idle | loading | loaded | error
        const ref = useRef(null);
        useEffect(() => {
            let objectUrl = null;
            let cancelled = false;
            const el = ref.current;
            if (!el && !eager) return;

            const load = async () => {
                if (cancelled) return;
                if (!id) return;
                setStatus('loading');
                try {
                    if (id.startsWith && id.startsWith('data:')) {
                        setSrc(id);
                        setStatus('loaded');
                        return;
                    }
                    if (Capacitor.isNativePlatform()) {
                        try {
                            const uriRes = await Filesystem.getUri({ path: id, directory: Directory.Data });
                            const nativeUri = uriRes && (uriRes.uri || uriRes.path || uriRes);
                            setSrc(Capacitor.convertFileSrc(nativeUri));
                            setStatus('loaded');
                            return;
                        } catch (uriErr) {
                            setSrc(Capacitor.convertFileSrc(id));
                            setStatus('loaded');
                            return;
                        }
                    }
                    // Web fallback: 优先通过 Filesystem 读取 Base64（若存在），否则 fetch blob
                    try {
                        const file = await Filesystem.readFile({ path: id, directory: Directory.Data });
                        const b64 = file.data;
                        const srcVal = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
                        setSrc(srcVal);
                        setStatus('loaded');
                        return;
                    } catch (fsErr) {
                        // fetch 兜底
                        const resp = await fetch(id);
                        if (!resp.ok) throw new Error('fetch failed');
                        const blob = await resp.blob();
                        objectUrl = URL.createObjectURL(blob);
                        setSrc(objectUrl);
                        setStatus('loaded');
                        return;
                    }
                } catch (err) {
                    console.error('LazyImg load failed:', id, err);
                    setStatus('error');
                }
            };

            if (eager) {
                load();
                return () => {
                    cancelled = true;
                    if (objectUrl) {
                        try { URL.revokeObjectURL(objectUrl); } catch (e) { /* ignore */ }
                    }
                };
            }

            const io = new IntersectionObserver((entries) => {
                entries.forEach(ent => {
                    if (ent.isIntersecting) {
                        load();
                        io.disconnect();
                    }
                });
            }, { rootMargin: '300px' });
            if (el) io.observe(el);

            return () => {
                cancelled = true;
                io.disconnect();
                if (objectUrl) {
                    try { URL.revokeObjectURL(objectUrl); } catch (e) { /* ignore */ }
                }
            };
        }, [id, eager]);

        if (status === 'error') {
            return <div className={className + ' w-full h-full flex items-center justify-center bg-red-500/10'}><Trash2 size={24} /></div>;
        }
        if (!src) {
            // 占位骨架
            return <div ref={ref} className={className + ' w-full h-full animate-pulse bg-zinc-700'} />;
        }
        return <img ref={ref} src={src} className={className} alt={alt} onClick={onClick} onError={() => setStatus('error')} loading={eager ? undefined : "lazy"} />;
    };

    // 存储迁移与加载逻辑
    useEffect(() => {
        const loadAndMigrate = async () => {
            try {
                const savedRaw = localStorage.getItem('captured_photos');
                if (!savedRaw) return;

                let savedList = [];
                try {
                    savedList = JSON.parse(savedRaw);
                } catch (e) {
                    console.error("Parse failed", e);
                    return;
                }

                if (!Array.isArray(savedList) || savedList.length === 0) return;

                // 检查是否包含老数据 (Base64)
                const hasLegacyData = savedList.some(item => item.startsWith && item.startsWith('data:image'));

                if (hasLegacyData) {
                    showToast('正在升级相册存储...', 'info');
                    const migratedList = [];
                    for (const item of savedList) {
                        if (item.startsWith('data:image')) {
                            const fname = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`;
                            try {
                                await Filesystem.writeFile({
                                    path: fname,
                                    data: item,
                                    directory: Directory.Data
                                });
                                migratedList.push(fname);
                            } catch (err) {
                                console.error("Migration write failed", err);
                                // 失败则保留原样，防止丢图(虽然可能存不下)
                                // migratedList.push(item); 
                            }
                        } else {
                            migratedList.push(item);
                        }
                    }
                    localStorage.setItem('captured_photos', JSON.stringify(migratedList));
                    setPhotos(migratedList);
                    showToast('相册升级完成！', 'success');
                } else {
                    setPhotos(savedList);
                }
            } catch (err) {
                console.error("Load photos failed:", err);
            }
        };
        loadAndMigrate();
    }, []);

    // 辅助：获取图片显示路径
    const [photoUrls, setPhotoUrls] = useState({}); // 缓存 filepath -> url 映射

    useEffect(() => {
        const resolveUrls = async () => {
            const newMap = { ...photoUrls };
            let changed = false;

            // 原生加速模式：不再逐字节读取文件，直接让 WebView 使用本地文件流。
            // 不对照片数量做截断（无限滚动/全部显示），在原生平台使用 convertFileSrc 提供高速本地访问。
            for (const p of photos) {
                    if (!newMap[p]) {
                    if (p.startsWith && p.startsWith('data:')) {
                        newMap[p] = p;
                        changed = true;
                    } else {
                        try {
                                if (Capacitor.isNativePlatform()) {
                                    // Native: obtain the native URI for the saved file and convert it to a WebView-safe src
                                    try {
                                        const uriRes = await Filesystem.getUri({ path: p, directory: Directory.Data });
                                        const nativeUri = uriRes && (uriRes.uri || uriRes.path || uriRes);
                                        newMap[p] = Capacitor.convertFileSrc(nativeUri);
                                    } catch (uriErr) {
                                        // fallback: try convertFileSrc with the raw path (older platforms)
                                        newMap[p] = Capacitor.convertFileSrc(p);
                                    }
                                    changed = true;
                                } else {
                                // Web fallback: try to read Base64 via Filesystem, otherwise fetch as blob
                                try {
                                    const file = await Filesystem.readFile({
                                        path: p,
                                        directory: Directory.Data
                                    });
                                    const b64 = file.data;
                                    const src = b64.startsWith('data:') ? b64 : `data:image/jpeg;base64,${b64}`;
                                    newMap[p] = src;
                                    changed = true;
                                } catch (fsErr) {
                                    // 最后兜底：尝试通过 fetch 获取（开发环境）
                                    try {
                                        const resp = await fetch(p);
                                        if (resp.ok) {
                                            const blob = await resp.blob();
                                            newMap[p] = URL.createObjectURL(blob);
                                            changed = true;
                                        } else {
                                            newMap[p] = 'error';
                                            changed = true;
                                        }
                                    } catch (fetchErr) {
                                        console.error("Resolve failed:", p, fetchErr);
                                        newMap[p] = 'error';
                                        changed = true;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("Resolve failed:", p, e);
                            newMap[p] = 'error';
                            changed = true;
                        }
                    }
                }
            }
            if (changed) setPhotoUrls(newMap);
        };
        resolveUrls();
    }, [photos]);

    // 虚拟化网格：按行渲染，仅渲染可视区 + 预加载若干行 (适用于规则网格，如 3 列)
    const VirtualizedGrid = ({ items, columnCount = 3, gapPx = 4, overscan = 3, renderCell }) => {
        const containerRef = useRef(null);
        const [viewportHeight, setViewportHeight] = useState(0);
        const [viewportWidth, setViewportWidth] = useState(0);
        const [scrollTop, setScrollTop] = useState(0);

        useEffect(() => {
            const el = containerRef.current;
            if (!el) return;
            const handleResize = () => {
                setViewportHeight(el.clientHeight);
                setViewportWidth(el.clientWidth);
            };
            handleResize();
            const ro = new ResizeObserver(handleResize);
            ro.observe(el);
            return () => ro.disconnect();
        }, []);

        const onScroll = (e) => {
            setScrollTop(e.target.scrollTop);
        };

        const totalGap = (columnCount - 1) * gapPx;
        const itemWidth = Math.max(0, (viewportWidth - totalGap) / columnCount);
        const rowHeight = itemWidth;
        const rowCount = Math.max(0, Math.ceil(items.length / columnCount));
        const totalHeight = rowCount * (rowHeight + gapPx) - gapPx;

        const startRow = Math.max(0, Math.floor(scrollTop / (rowHeight + gapPx)) - overscan);
        const endRow = Math.min(rowCount - 1, Math.ceil((scrollTop + viewportHeight) / (rowHeight + gapPx)) + overscan);

        const rows = [];
        for (let r = startRow; r <= endRow; r++) {
            const cols = [];
            for (let c = 0; c < columnCount; c++) {
                const idx = r * columnCount + c;
                const item = items[idx];
                cols.push(
                    <div key={c} style={{ width: `${100 / columnCount}%`, height: rowHeight, overflow: 'hidden' }} className="">
                        {item ? renderCell(item, idx) : <div className="w-full h-full bg-transparent" />}
                    </div>
                );
            }
            rows.push(
                <div key={r} style={{ position: 'absolute', top: r * (rowHeight + gapPx), left: 0, right: 0, height: rowHeight, display: 'flex', gap: `${gapPx}px` }}>
                    {cols}
                </div>
            );
        }

        return (
            <div ref={containerRef} onScroll={onScroll} style={{ height: '100%', overflowY: 'auto' }} className="no-scrollbar">
                <div style={{ height: totalHeight, position: 'relative' }}>
                    {rows}
                </div>
            </div>
        );
    };

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
            case 'saturated': return { ...baseStyle, filter: 'saturate(1.6) brightness(1.05) contrast(1.15) hue-rotate(-6deg)' };
            case 'lightleak': return { ...baseStyle, filter: 'brightness(1.08) contrast(0.95) saturate(1.05) hue-rotate(6deg) blur(0.8px)' };
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
        // 快照当前画布到独立 baseCanvas，避免在后续合成时从同一 ctx 读取导致自我叠加/变黑
        const baseCanvas = document.createElement('canvas');
        baseCanvas.width = width;
        baseCanvas.height = height;
        const baseCtx = baseCanvas.getContext('2d');
        baseCtx.putImageData(imageData, 0, 0);
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
                } else if (effectiveMode === 'saturated') {
                    // 高饱和：增强色彩对比与亮度
                    r = Math.min(255, r * 1.25);
                    g = Math.min(255, g * 1.25);
                    b = Math.min(255, b * 1.45);
                    // 轻微对比拉伸
                    r = ((r - 128) * 1.08) + 128;
                    g = ((g - 128) * 1.08) + 128;
                    b = ((b - 128) * 1.08) + 128;
                } else if (effectiveMode === 'lightleak') {
                    // 漏光：局部偏色与亮斑（后处理在帧上模拟）
                    r = r * 0.88 + 30; g = g * 0.85 + 20; b = b * 0.92 + 10;
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
            // 为后续合成准备处理后的基底快照（使用已写回 ctx 的像素）
            const procBaseCanvas = document.createElement('canvas');
            procBaseCanvas.width = width;
            procBaseCanvas.height = height;
            const procBaseCtx = procBaseCanvas.getContext('2d');
            procBaseCtx.drawImage(ctx.canvas, 0, 0);
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

            // 4. 程序化笔触渲染 -> 改为基于边缘图的干净线稿渲染，保持纸张质感
            // 将边缘数组转换为独立线稿图层，再叠加以获得更清晰的黑线效果
            const edgeThreshold = 28; // 边缘阈值，越低线越多
            const lineCanvas = document.createElement('canvas');
            lineCanvas.width = width;
            lineCanvas.height = height;
            const lctx = lineCanvas.getContext('2d');
            // 透明背景
            lctx.clearRect(0, 0, width, height);

            // 直接写像素到线稿图层
            const lineImg = lctx.createImageData(width, height);
            const lineBuf = lineImg.data;
            for (let i = 0; i < width * height; i++) {
                const v = edges[i];
                if (v > edgeThreshold) {
                    // 边缘强度映射到 alpha
                    const alpha = Math.min(255, Math.floor((v / 255) * 255 * 1.2));
                    const off = i * 4;
                    lineBuf[off] = 0;
                    lineBuf[off + 1] = 0;
                    lineBuf[off + 2] = 0;
                    lineBuf[off + 3] = alpha;
                } else {
                    // 透明
                    const off = i * 4;
                    lineBuf[off] = 0; lineBuf[off + 1] = 0; lineBuf[off + 2] = 0; lineBuf[off + 3] = 0;
                }
            }
            lctx.putImageData(lineImg, 0, 0);

            // 稍微膨胀线条以模拟笔触粗细：通过多次偏移绘制自身实现
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            // 在主画布上先绘制一遍线稿（较弱），再绘制多次偏移以加粗关键线条
            ctx.drawImage(lineCanvas, 0, 0);
            const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]];
            ctx.globalAlpha = 0.9;
            for (let k = 0; k < offsets.length; k++) {
                const o = offsets[k];
                ctx.drawImage(lineCanvas, o[0], o[1]);
            }
            ctx.restore();

            // 小量的擦拭/炭笔效果：在暗部叠加少量随机笔触提高质感
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 0.06;
            ctx.fillStyle = '#000';
            const grainStep = Math.max(3, Math.round(Math.min(width, height) / 300));
            for (let y = 0; y < height; y += grainStep) {
                for (let x = 0; x < width; x += grainStep) {
                    const idx = y * width + x;
                    if (gray[idx] < 80 && Math.random() > 0.88) {
                        ctx.fillRect(x + (Math.random() - 0.5) * 2, y + (Math.random() - 0.5) * 2, 1, 1);
                    }
                }
            }
            ctx.globalAlpha = 1.0;
        }

        // === 专业艺术漫画：现代商业渲染 (Cel Shading, Rim Lighting, Bloom) ===
        else if (effectiveMode === 'manga') {
            // 针对“样例漫画”(sample) 模式：独立处理，保证绝对真实色彩 + 漫画覆盖层
            if (mangaEffect === 'sample') {
                // 1. 底图：直接使用原图 (baseCanvas)，重置 ctx
                ctx.drawImage(baseCanvas, 0, 0);
                const width = ctx.canvas.width;
                const height = ctx.canvas.height;

                // 2. 黑白网点 (Halftone)
                const dotCanvasS = document.createElement('canvas');
                dotCanvasS.width = width; dotCanvasS.height = height;
                const dCtxS = dotCanvasS.getContext('2d');
                const sampleData = baseCanvas.getContext('2d').getImageData(0, 0, width, height).data;
                // 网点大小
                // 网点大小：非常小，细腻质感
                const gsizeS = Math.max(2, Math.round(Math.min(width, height) / 160));
                dCtxS.fillStyle = 'black';

                for (let y = 0; y < height; y += gsizeS) {
                    for (let x = 0; x < width; x += gsizeS) {
                        const idx = (y * width + x) * 4;
                        const bri = (sampleData[idx] + sampleData[idx + 1] + sampleData[idx + 2]) / 3;
                        // 仅在暗部显示网点
                        if (bri < 230) {
                            const radius = (1 - (bri / 255)) * (gsizeS / 1.6);
                            if (radius > 0.5) {
                                dCtxS.beginPath();
                                dCtxS.arc(x + gsizeS / 2, y + gsizeS / 2, radius, 0, Math.PI * 2);
                                dCtxS.fill();
                            }
                        }
                    }
                }
                // 叠加网点
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(dotCanvasS, 0, 0);

                // 3. 强力墨线 (Thick Ink Lines) - 独立计算
                const lCanvas = document.createElement('canvas');
                lCanvas.width = width; lCanvas.height = height;
                const lCtx = lCanvas.getContext('2d');
                const lineImg = lCtx.createImageData(width, height);
                const lb = lineImg.data;

                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = (y * width + x) * 4;
                        const getBri = (i) => (sampleData[i] + sampleData[i + 1] + sampleData[i + 2]) / 3;
                        const c = getBri(idx);
                        const r = getBri(idx + 4);
                        const b = getBri(idx + width * 4);
                        if (Math.abs(c - r) + Math.abs(c - b) > 50) {
                            lb[idx + 3] = 255;
                        }
                    }
                }
                lCtx.putImageData(lineImg, 0, 0);

                const offsets = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
                for (let o of offsets) {
                    ctx.drawImage(lCanvas, o[0], o[1]);
                }

                // 4. 速度线 & 5. BAM Text 已按用户要求移除，保持画面纯净


                return; // 结束处理，跳过后续所有逻辑
            }

            // 1. 颜色工程：赛璐璐上色 (Cel Shading) 与 强对比平涂
            for (let i = 0; i < total; i += 4) {
                let r = data[i], g = data[i + 1], b = data[i + 2];

                // 使用 HSL 调色以保持色相稳定并提高饱和度（避免直接按通道拉伸导致颜色失真）
                const [h, s, l] = rgbToHsl(r, g, b);
                const newS = Math.min(1, s * 1.35); // 适度提高饱和
                // 轻微提升对比（通过 L 值非线性映射）
                const newL = l < 0.5 ? Math.pow(l, 0.92) : 1 - Math.pow(1 - l, 0.92);
                const [nr, ng, nb] = hslToRgb(h, newS, newL);

                // 赛璐璐分层 (更明显的平涂分块)，在 HSL 调整后对通道量化
                const levels = 3;
                const step = 256 / levels;
                r = Math.floor(nr / step) * step;
                g = Math.floor(ng / step) * step;
                b = Math.floor(nb / step) * step;

                data[i] = Math.min(255, Math.max(0, r));
                data[i + 1] = Math.min(255, Math.max(0, g));
                data[i + 2] = Math.min(255, Math.max(0, b));
            }
            ctx.putImageData(imageData, 0, 0);

            // 2. 结构提取：动态勾边 (Varying Line Weight) 与 轮廓光 (Rim Light)
            const edgeCanvas = document.createElement('canvas');
            edgeCanvas.width = width; edgeCanvas.height = height;
            const eCtx = edgeCanvas.getContext('2d');
            // 使用已处理的基底快照进行边缘提取，避免读取被修改的 ctx 导致不稳定合成
            eCtx.drawImage(procBaseCanvas || baseCanvas, 0, 0);
            const eData = eCtx.getImageData(0, 0, width, height).data;

            // 3. 细节合成 (Compositing)：更强的墨线与选择性网点
            const gridSize = width > 2000 ? 12 : 6;

            for (let y = 0; y < height; y += gridSize) {
                for (let x = 0; x < width; x += gridSize) {
                    const idx = (y * width + x) * 4;
                    const r = eData[idx], g = eData[idx + 1], b = eData[idx + 2];
                    const br = (r + g + b) / 3;

                    // --- A. 网点 (Halftone)：仅在暗部绘制，增强漫画质感 ---
                    if (br < 150) {
                        const radius = (1 - br / 255) * (gridSize / 2) * 1.2;
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                        ctx.beginPath();
                        ctx.arc(x + gridSize / 2, y + gridSize / 2, radius, 0, Math.PI * 2);
                        ctx.fill();
                    }

                    // --- B. 动态墨迹勾边：更明显的黑色笔触 ---
                    const rightIdx = idx + 4 < eData.length ? idx + 4 : idx;
                    const bottomIdx = idx + width * 4 < eData.length ? idx + width * 4 : idx;
                    const dR = Math.abs(eData[idx] - eData[rightIdx]) + Math.abs(eData[idx + 1] - eData[rightIdx + 1]) + Math.abs(eData[idx + 2] - eData[rightIdx + 2]);
                    const dB = Math.abs(eData[idx] - eData[bottomIdx]) + Math.abs(eData[idx + 1] - eData[bottomIdx + 1]) + Math.abs(eData[idx + 2] - eData[bottomIdx + 2]);
                    if (dR > 60 || dB > 60) {
                        ctx.fillStyle = 'black';
                        const weight = Math.min(gridSize * 0.9, ((dR + dB) / 150) * (width > 2000 ? 6 : 3));
                        ctx.fillRect(x, y, Math.max(1, Math.round(weight)), Math.max(1, Math.round(weight)));
                    }

                    // --- C. 轮廓光 (Rim Lighting)：边缘高亮以凸显人物轮廓 ---
                    if (br > 210 && (x < 20 || x > width - 20 || y < 20 || y > height - 20)) {
                        ctx.shadowBlur = 18;
                        ctx.shadowColor = 'rgba(255,255,255,0.6)';
                        ctx.fillStyle = 'rgba(255,255,255,0.55)';
                        ctx.fillRect(x, y, gridSize, gridSize);
                        ctx.shadowBlur = 0;
                    }
                }
            }

            // 4. 后期特效：轻微溢光 (Bloom)
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.15;
            // 使用 baseCanvas 快照进行柔光叠加，避免对当前正在绘制的 ctx 自身叠加
            ctx.drawImage(baseCanvas, 0, 0); // 自叠加产生柔光
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;

            // 5. 速度线已移除为默认行为，只有在特定子风格（如 pop）内生成

            // 6. 可选：添加漫画文字贴纸（默认小幅度展示，若不需要可删除）
            try {
                ctx.save();
                const fontSize = Math.round(Math.min(width, height) / 8);
                ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
                // 漫画贴纸默认关闭，若需要请将 text 变量取消注释或替换为动态文本
                // const text = 'BAM!';
                const tx = Math.round(width * 0.62);
                const ty = Math.round(height * 0.72);
                // 描边白色填充黑边（示例注释掉实际文字）
                // ctx.lineWidth = Math.max(6, Math.round(fontSize / 8));
                // ctx.strokeStyle = 'black';
                // ctx.fillStyle = 'white';
                // ctx.strokeText(text, tx, ty);
                // ctx.fillText(text, tx, ty);
                ctx.restore();
            } catch (e) {
                console.debug('Comic text overlay skipped:', e);
            }

            // 7. 漫画子风格扩展已移除 (按用户要求简化为仅保留原味和样例)

        }
    };

    // 4. 拍照核心逻辑
    const takePhoto = () => {
        // 移除 canvasRef 检查 (它其实只是个隐藏的 buffer，不一定非要 mounting 时立即存在，可以在 process 时创建)
        // 增加 readyState 检查：防止在视频流尚未准备好时点击拍照导致“无反应”或黑屏
        if (!videoRef.current || videoRef.current.readyState < 2) {
            showToast('相机正在预热...', 'info');
            return;
        }

        // 立即触发音效 (Removed Flash Animation)
        playSound('1.mp3');
        setIsProcessing(true);


        // 使用 setTimeout 将繁重的图像处理推迟到下一帧，
        // 让 React 有机会先渲染快门动画 (IsShutterActive)，如果不这样做，
        // 繁重的同步计算会阻塞主线程，导致 UI 卡住，看不到闪光效果。
        setTimeout(() => {
            try {
                const video = videoRef.current;
                // 使用独立的 finalCanvas 完成所有绘制与合成，避免修改到 UI canvas 带来副作用
                const finalCanvas = document.createElement('canvas');
                finalCanvas.width = video.videoWidth;
                finalCanvas.height = video.videoHeight;
                const fCtx = finalCanvas.getContext('2d');
                // 开启最高清晰度渲染
                fCtx.imageSmoothingEnabled = true;
                fCtx.imageSmoothingQuality = 'high';

                // 检测当前是否使用了硬件缩放
                const hasHardwareZoom = capabilities?.zoom && stream;

                // 绘制原图到 finalCanvas
                if (hasHardwareZoom) {
                    // 如果是硬件变焦，视频流已经是放大后的，直接全屏绘制
                    fCtx.drawImage(video, 0, 0, finalCanvas.width, finalCanvas.height);
                } else {
                    // 传统数字变焦：手动裁切中心
                    const sw = video.videoWidth / zoom;
                    const sh = video.videoHeight / zoom;
                    const sx = (video.videoWidth - sw) / 2;
                    const sy = (video.videoHeight - sh) / 2;
                    fCtx.drawImage(video, sx, sy, sw, sh, 0, 0, finalCanvas.width, finalCanvas.height);
                }

                // 拍立得色彩处理 (简单滤镜)
                if (mode === 'polaroid') {
                    fCtx.filter = 'sepia(30%) contrast(110%) brightness(110%)';
                    if (hasHardwareZoom) {
                        fCtx.drawImage(video, 0, 0, finalCanvas.width, finalCanvas.height);
                    } else {
                        const sw = video.videoWidth / zoom;
                        const sh = video.videoHeight / zoom;
                        const sx = (video.videoWidth - sw) / 2;
                        const sy = (video.videoHeight - sh) / 2;
                        fCtx.drawImage(video, sx, sy, sw, sh, 0, 0, finalCanvas.width, finalCanvas.height);
                    }
                    fCtx.filter = 'none';
                }

                // 高级像素处理 (素描/漫画/各种幻想效果)
                const hasPixelFilter = mode === 'sketch' || mode === 'manga' ||
                    (mode === 'polaroid' && polaroidEffect !== 'none') ||
                    (mode === 'sketch' && sketchEffect !== 'none') ||
                    (mode === 'manga' && mangaEffect !== 'none');
                if (hasPixelFilter) {
                    try {
                        // 在 finalCanvas 上应用像素级滤镜
                        applyPixelFilter(fCtx, finalCanvas.width, finalCanvas.height);
                    } catch (err) {
                        console.error('applyPixelFilter failed:', err);
                        // 如果滤镜失败，继续使用未滤镜的 finalCanvas
                    }
                }

                let finalDataUrl;

                // 拍立得效果：根据子选项生成各种变异边框
                if (mode === 'polaroid') {
                    const frameCanvas = document.createElement('canvas');
                    const fCtx2 = frameCanvas.getContext('2d');
                    const padding = finalCanvas.width * 0.08;
                    const bottomSpace = finalCanvas.width * 0.28;

                    frameCanvas.width = finalCanvas.width + padding * 2;
                    frameCanvas.height = finalCanvas.height + padding + bottomSpace;
                    const fw = frameCanvas.width;
                    const fh = frameCanvas.height;

                    const effect = polaroidEffect;

                    // 1. 基础背景绘制
                    // 1. 基础背景绘制 (经典自尊白)
                    fCtx2.fillStyle = '#fdfdfd';
                    fCtx2.fillRect(0, 0, fw, fh);

                    // 风格特定背景/边框装饰
                    if (effect === 'vintage') {
                        // 复古：微微泛黄的旧纸感
                        fCtx2.fillStyle = 'rgba(255, 200, 50, 0.05)';
                        fCtx2.fillRect(0, 0, fw, fh);
                        // 模拟漏光效果
                        const grd = fCtx2.createLinearGradient(0, 0, fw, 0);
                        grd.addColorStop(0, 'rgba(255, 50, 0, 0)');
                        grd.addColorStop(0.5, 'rgba(255, 50, 0, 0.1)');
                        grd.addColorStop(1, 'rgba(255, 50, 0, 0)');
                        fCtx2.fillStyle = grd;
                        fCtx2.fillRect(0, 0, fw, fh);
                    } else if (effect === 'saturated') {
                        // 高饱和：增强边框亮度与光泽
                        fCtx2.fillStyle = 'rgba(255, 255, 255, 0.9)';
                        fCtx2.fillRect(0, 0, fw, fh);
                        fCtx2.strokeStyle = 'rgba(255,240,220,0.2)';
                        fCtx2.lineWidth = 2;
                        fCtx2.strokeRect(padding / 2, padding / 2, fw - padding, fh - padding);
                        // 增加轻微辉光效果
                        fCtx2.globalAlpha = 0.06;
                        fCtx2.fillStyle = 'rgba(255,220,180,0.5)';
                        fCtx2.fillRect(0, 0, fw, fh);
                        fCtx2.globalAlpha = 1.0;
                    } else if (effect === 'lightleak') {
                        // 漏光：模拟侧向红色/橙色光晕
                        fCtx2.fillStyle = 'rgba(0,0,0,0)';
                        fCtx2.fillRect(0, 0, fw, fh);
                        const lg = fCtx2.createLinearGradient(0, 0, fw * 0.6, fh * 0.3);
                        lg.addColorStop(0, 'rgba(255,120,60,0.0)');
                        lg.addColorStop(0.35, 'rgba(255,100,40,0.12)');
                        lg.addColorStop(0.6, 'rgba(255,80,20,0.08)');
                        lg.addColorStop(1, 'rgba(255,80,20,0.0)');
                        fCtx2.globalCompositeOperation = 'screen';
                        fCtx2.fillStyle = lg;
                        fCtx2.fillRect(0, 0, fw, fh);
                        fCtx2.globalCompositeOperation = 'source-over';

                    } else if (effect === 'warm') {
                        // 温馨：由于像素处理已偏暖，此处加一个淡淡的橙色晕染
                        fCtx2.fillStyle = 'rgba(255, 100, 0, 0.02)';
                        fCtx2.fillRect(0, 0, fw, fh);
                    }

                    // 2. 绘制相片主体（使用 finalCanvas）
                    fCtx2.drawImage(finalCanvas, padding, padding);

                    // 3. 细节装饰：颗粒与物理真实感
                    fCtx2.globalAlpha = 0.03;
                    fCtx2.fillStyle = '#000';
                    for (let i = 0; i < fw; i += 5) fCtx2.fillRect(i, 0, 1, fh); // 细微扫描线
                    fCtx2.globalAlpha = 1.0;

                    // 给照片本体加一个非常细的灰色描边，模拟纸张边缘
                    fCtx2.strokeStyle = 'rgba(0,0,0,0.1)';
                    fCtx2.lineWidth = 1;
                    fCtx2.strokeRect(padding, padding, finalCanvas.width, finalCanvas.height);

                    // 3. 全局纹理覆盖 (所有变异增加一张颗粒感网格)
                    fCtx2.globalAlpha = 0.05;
                    fCtx2.fillStyle = '#000';
                    for (let i = 0; i < fw; i += 4) fCtx2.fillRect(i, 0, 1, fh);
                    fCtx2.globalAlpha = 1.0;

                    finalDataUrl = frameCanvas.toDataURL('image/jpeg', 0.85);
                } else {
                    finalDataUrl = finalCanvas.toDataURL('image/jpeg', 0.90);
                }

                setCapturedImage(finalDataUrl);
            } catch (err) {
                console.error("Capture failed:", err);
                showToast('拍摄出错: ' + err.message, 'error');
            } finally {
                setIsProcessing(false); // 结束处理状态
            }
        }, 30); // 略微增加延迟以确保 Loading UI 先渲染出来
    };

    // 保存
    // 保存 (仅保存到 App 相册，不自动下载)
    // 保存 (保存到 App 内部文件系统)
    const savePhoto = async () => {
        if (!capturedImage) return;
        playSound('1.mp3');

        try {
            // 生成文件名
            const fileName = `cyber_${Date.now()}.jpg`;

            // 写入 App Data 目录 (无限容量)
            await Filesystem.writeFile({
                path: fileName,
                data: capturedImage.split(',')[1], // 去掉 prefix
                directory: Directory.Data
            });

            // 更新状态 (只存文件名)
            const newPhotos = [fileName, ...photos]; // 不再限制 slice(0, 40)
            setPhotos(newPhotos);
            localStorage.setItem('captured_photos', JSON.stringify(newPhotos));

            showToast('已保存到相册', 'success');
        } catch (storageErr) {
            console.error("Save to filesystem failed:", storageErr);
            showToast('存储失败: ' + storageErr.message, 'error');
        }

        // 退出预览页
        setCapturedImage(null);
    };

    // 手动下载照片 (保存到设备)
    // 手动下载照片 (保存到设备公共目录)
    const downloadPhoto = async (photoId) => {
        if (!photoId) return;
        playSound('1.mp3');

        // 1. 获取源文件内容 (Base64) - 兼容新旧数据
        let base64Data = '';
        if (photoId.startsWith('data:')) {
            base64Data = photoId.split(',')[1];
        } else {
            // 从 Data 目录读取物理文件
            try {
                const file = await Filesystem.readFile({
                    path: photoId,
                    directory: Directory.Data,
                    encoding: Encoding.UTF8
                });
                const raw = file.data;
                // 智能兼容：分离 Body 和 Full URL
                if (raw.startsWith('data:')) {
                    base64Data = raw.split(',')[1];
                } else {
                    base64Data = raw;
                }
            } catch (e) {
                console.error("Read file failed:", e);
                showToast('无法读取原图', 'error');
                return;
            }
        }

        const dataUrl = `data:image/jpeg;base64,${base64Data}`;

        if (Capacitor.isNativePlatform()) {
            try {
                const fileName = `CyberPhoto_${Date.now()}.jpg`;
                await Filesystem.writeFile({
                    path: fileName,
                    data: base64Data, // 直接写入 Base64 string
                    directory: Directory.Documents,
                });
                showToast('✨ 已保存到系统文档！', 'success');
                Share.share({
                    title: '保存我的赛博瞬间',
                    url: dataUrl,
                    dialogTitle: '保存到相册或分享',
                }).catch(e => console.debug("Share closed or failed:", e));
            } catch (err) {
                console.error("Save failed:", err);
                showToast('保存失败，请检查存储权限', 'error');
            }
        } else {
            try {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = `cyber-photo-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('✨ 已下载照片', 'success');
            } catch (e) {
                console.error("Web download failed", e);
            }
        }
    };
    /* Legacy download function removed */
    const _legacy_downloadPhoto_signature = async (imgUrl) => {
        if (!imgUrl) return;
        playSound('1.mp3');

        if (Capacitor.isNativePlatform()) {
            try {
                const fileName = `CyberPhoto_${Date.now()}.jpg`;
                await Filesystem.writeFile({
                    path: fileName,
                    data: imgUrl.split(',')[1],
                    directory: Directory.Documents,
                });
                showToast('✨ 已保存到系统文档！', 'success');
                Share.share({
                    title: '保存我的赛博瞬间',
                    url: imgUrl,
                    dialogTitle: '保存到相册或分享',
                }).catch(e => console.debug("Share closed or failed:", e));
            } catch (err) {
                console.error("Save failed:", err);
                showToast('保存失败，请检查存储权限', 'error');
            }
        } else {
            try {
                const link = document.createElement('a');
                link.href = imgUrl;
                link.download = `cyber-photo-${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast('✨ 已下载照片', 'success');
            } catch (e) {
                console.error("Web download failed", e);
            }
        }
    };

    // 删除照片
    const deletePhoto = (index) => {
        setConfirmDialog({
            title: '删除照片',
            message: '这张珍贵的赛博瞬间将永久消失，确定吗？',
            onConfirm: async () => {
                playSound('1.mp3');
                try {
                    const photoToDelete = photos[index];

                    // 1. 如果是文件，删除物理文件
                    if (!photoToDelete.startsWith('data:')) {
                        try {
                            await Filesystem.deleteFile({
                                path: photoToDelete,
                                directory: Directory.Data
                            });
                        } catch (fsErr) {
                            console.warn("File delete failed (maybe missing):", fsErr);
                        }
                    }

                    // 2. 更新列表
                    let nextIndex = null;
                    if (photos.length > 1) {
                        nextIndex = (index === photos.length - 1) ? index - 1 : index;
                    }

                    const newPhotos = photos.filter((_, i) => i !== index);
                    setPhotos(newPhotos);
                    setViewingPhotoIndex(nextIndex);

                    // 3. 持久化列表
                    localStorage.setItem('captured_photos', JSON.stringify(newPhotos));
                    showToast('照片已移出相册', 'info');
                } catch (e) {
                    console.error("Delete failed:", e);
                    showToast('移除失败：' + e.message, 'error');
                } finally {
                    setConfirmDialog(null);
                }
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
            {/* --- 闪光 (已移除) --- */}
            {/* <AnimatePresence> ... </AnimatePresence> */}


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
                        disabled={isProcessing}
                        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center backdrop-blur-sm transition-all ${isProcessing ? 'border-zinc-500 bg-zinc-800 scale-95' : 'border-white bg-white/20'}`}
                    >
                        {isProcessing ? (
                            <RefreshCw className="animate-spin text-white/50" size={32} />
                        ) : (
                            <div className={`w-16 h-16 rounded-full ${mode === 'normal' ? 'bg-white' : 'bg-red-500'} transition-colors duration-300`} />
                        )}
                    </motion.button>

                    {/* 右侧：相册入口 (缩略图) */}
                    <button
                        onClick={() => { setIsGalleryOpen(true); playSound('1.mp3'); }}
                        className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden bg-zinc-800 active:scale-95 transition-all"
                    >
                        {photos.length > 0 ? (
                            <LazyImg id={photos[0]} className="w-full h-full object-cover opacity-80" alt="最新" eager={true} />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50"><ImageIcon size={20} /></div>
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
                        <div style={{ height: '100%' }} className="flex-1 overflow-y-auto p-4">
                            {photos.length === 0 && <div className="col-span-3 text-center text-white/20 mt-20">暂无照片</div>}
                            {photos.length > 0 && (
                                <VirtualizedGrid
                                    items={photos}
                                    columnCount={3}
                                    gapPx={4}
                                    overscan={3}
                                    renderCell={(item, index) => (
                                        <div key={index} onClick={() => setViewingPhotoIndex(index)} className="relative rounded-sm overflow-hidden">
                                            <LazyImg id={item} className="w-full h-full object-cover" alt={`照片 ${index}`} />
                                        </div>
                                    )}
                                />
                            )}
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
                            {photos[viewingPhotoIndex] && (
                                <LazyImg id={photos[viewingPhotoIndex]} className="w-full flex-1 object-contain pointer-events-none" alt="大图" eager={true} />
                            )}

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
                                <button onClick={() => downloadPhoto(photos[viewingPhotoIndex])} className="flex flex-col items-center gap-1 text-white/80 active:scale-90 transition-all">
                                    <Download size={24} /> <span className="text-[10px]">下载保存</span>
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
