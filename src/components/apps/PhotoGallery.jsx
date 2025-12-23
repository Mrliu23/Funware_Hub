import React, { useState, useEffect } from 'react';
import { ArrowLeft, Image as ImageIcon, Trash2, Layers, Heart, Share2, Download, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from '../../utils/audio';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

/**
 * 赛博相册 (PhotoGallery)
 * 这是一个独立的相册应用，可以查看由相机拍摄的照片。
 * 支持删除照片、将照片设为壁纸。
 */
const PhotoGallery = ({ onClose, onSetWallpaper }) => {
    const [photos, setPhotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [downloadStatus, setDownloadStatus] = useState(null); // 'idle', 'loading', 'success'
    const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'info' }
    const [confirmDialog, setConfirmDialog] = useState(null); // { title: string, message: string, onConfirm: function }
    const [viewingDirection, setViewingDirection] = useState(0); // 1 for next, -1 for prev

    // 1. 初始化：从本地存储加载照片
    useEffect(() => {
        const savedPhotos = localStorage.getItem('captured_photos');
        if (savedPhotos) {
            setPhotos(JSON.parse(savedPhotos));
        }
    }, []);

    // 2. 删除照片
    const deletePhoto = (e, index) => {
        e.stopPropagation();
        setConfirmDialog({
            title: '删除照片',
            message: '这张珍贵的赛博瞬间将从手机中移除，确定吗？',
            onConfirm: () => {
                playSound('1.mp3');
                const newPhotos = photos.filter((_, i) => i !== index);
                setPhotos(newPhotos);
                localStorage.setItem('captured_photos', JSON.stringify(newPhotos));
                if (selectedPhoto === index) setSelectedPhoto(null);
                setConfirmDialog(null);
                showToast('照片已移出相册', 'info');
            }
        });
    };

    // 3. 设为壁纸
    const handleSetWallpaper = (url) => {
        playSound('1.mp3');
        onSetWallpaper(url);
        showToast('✨ 壁纸设置成功！', 'success');
    };

    // 4. 下载照片 (原生增强版)
    const handleDownload = async (url) => {
        try {
            setDownloadStatus('loading');
            playSound('1.mp3');

            if (Capacitor.isNativePlatform()) {
                const fileName = `CyberPhoto_${Date.now()}.jpg`;
                // 核心判定：文件由于系统底层写入成功
                await Filesystem.writeFile({
                    path: fileName,
                    data: url.split(',')[1],
                    directory: Directory.Documents
                });

                // 一旦写入成功，立即显示成功状态
                setDownloadStatus('success');
                showToast('✨ 已成功保存到系统文档！', 'success');

                // 异步唤起分享，不再等待其反馈
                Share.share({
                    title: '保存照片',
                    url: url,
                    dialogTitle: '保存到相册',
                }).catch(e => console.debug("Gallery share canceled/failed:", e));

            } else {
                // Web 降级逻辑
                const blob = await (await fetch(url)).blob();
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `CyberPhoto_${Date.now()}.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                setDownloadStatus('success');
                showToast('已开始下载', 'success');
            }

            setTimeout(() => setDownloadStatus(null), 2000);
        } catch (error) {
            console.error("Save failed:", error);
            showToast("保存失败，请检查存储权限", "error");
            setDownloadStatus(null);
        }
    };

    // 显示 Toast
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // 5. 监听返回键逻辑
    useEffect(() => {
        const handleBack = (e) => {
            if (selectedPhoto !== null) {
                e.preventDefault();
                setSelectedPhoto(null);
            }
        };
        window.addEventListener('appBackButtonPressed', handleBack);
        return () => window.removeEventListener('appBackButtonPressed', handleBack);
    }, [selectedPhoto]);

    return (
        <div className="h-full bg-zinc-950 flex flex-col text-white overflow-hidden">
            {/* --- 顶部导航栏 --- */}
            <div className="pt-10 pb-5 px-5 flex items-center justify-between bg-zinc-900/50 backdrop-blur-xl border-b border-white/5 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 active:scale-95 transition-all border border-white/5"
                    >
                        <ArrowLeft size={24} className="text-white" />
                    </button>
                    <h1 className="text-xl font-black italic tracking-tighter">赛博图库 (Photo Vault)</h1>
                </div>
                <div className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                    {photos.length} 张影像
                </div>
            </div>

            {/* --- 照片列表区域 --- */}
            <div className="flex-1 overflow-y-auto p-4 bg-zinc-950 no-scrollbar">
                {photos.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
                            <ImageIcon size={100} strokeWidth={0.5} />
                        </motion.div>
                        <p className="mt-6 font-black text-xs uppercase tracking-[0.5em]">存储核心为空 (Empty)</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {photos.map((url, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => { setSelectedPhoto(idx); playSound('1.mp3'); }}
                                className="aspect-square relative rounded-xl overflow-hidden border border-white/5 bg-zinc-900 shadow-lg active:scale-95 transition-transform group"
                            >
                                <img src={url} alt={`照片 ${idx}`} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-500" />
                                <div className="absolute inset-0 bg-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none" />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 全屏大图预览模式 (支持左右滑动) --- */}
            {selectedPhoto !== null && (
                <div className="fixed inset-0 z-50 bg-black overflow-hidden">
                    <AnimatePresence initial={false} custom={viewingDirection}>
                        <motion.div
                            key={selectedPhoto}
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
                                if (swipe < -100 && selectedPhoto < photos.length - 1) {
                                    setViewingDirection(1);
                                    setSelectedPhoto(selectedPhoto + 1);
                                    playSound('1.mp3');
                                } else if (swipe > 100 && selectedPhoto > 0) {
                                    setViewingDirection(-1);
                                    setSelectedPhoto(selectedPhoto - 1);
                                    playSound('1.mp3');
                                }
                            }}
                            className="absolute inset-0 flex flex-col touch-none"
                        >
                            {/* 退出按钮 */}
                            <button
                                onClick={() => { setViewingDirection(0); setSelectedPhoto(null); }}
                                className="absolute top-10 left-8 p-3 bg-white/10 rounded-full text-white backdrop-blur-md z-50 border border-white/10 active:scale-90 transition-transform"
                            >
                                <ArrowLeft size={24} />
                            </button>

                            {/* 指示器 */}
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-white/5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-white/40 border border-white/5">
                                {selectedPhoto + 1} / {photos.length}
                            </div>

                            {/* 大图展示 (悬浮感) */}
                            <div className="flex-1 flex items-center justify-center p-6">
                                <motion.div
                                    className="relative bg-white p-3 pb-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-sm rotate-1"
                                >
                                    <img
                                        src={photos[selectedPhoto]}
                                        className="max-w-full max-h-[60vh] object-contain shadow-inner pointer-events-none"
                                    />
                                    <div className="absolute bottom-4 left-6 right-6 flex flex-col gap-1 opacity-20">
                                        <div className="h-0.5 bg-black w-full" />
                                        <div className="h-0.5 bg-black w-2/3" />
                                    </div>
                                </motion.div>
                            </div>

                            {/* 底部控制栏 */}
                            <div className="p-10 flex justify-around items-center bg-gradient-to-t from-black to-transparent">
                                <button
                                    onClick={(e) => deletePhoto(e, selectedPhoto)}
                                    className="flex flex-col items-center gap-2 text-white/40 hover:text-rose-500 transition-colors group"
                                >
                                    <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-rose-500/20 group-hover:border-rose-500/40 border border-white/5 transition-all active:scale-90"><Trash2 size={24} /></div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">删除</span>
                                </button>

                                <button
                                    onClick={() => handleSetWallpaper(photos[selectedPhoto])}
                                    className="flex flex-col items-center gap-3 text-white group"
                                >
                                    <div className="p-5 bg-indigo-600 rounded-3xl shadow-[0_10px_30px_rgba(79,70,229,0.5)] group-hover:scale-110 active:scale-90 transition-transform"><Layers size={28} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">设为壁纸</span>
                                </button>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleDownload(photos[selectedPhoto])}
                                    className={`flex flex-col items-center gap-2 transition-all duration-500 ${downloadStatus === 'success' ? 'text-emerald-400' : 'text-white/40 hover:text-emerald-500'}`}
                                >
                                    <div className={`p-4 rounded-2xl border transition-all duration-500 ${downloadStatus === 'success' ? 'bg-emerald-500/20 border-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.3)]' : 'bg-white/5 border-white/5 active:bg-white/10 active:scale-90'}`}>
                                        {downloadStatus === 'success' ? <Check size={24} className="animate-in zoom-in duration-300" /> : <Download size={24} />}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        {downloadStatus === 'success' ? '已存入相册' : '导出'}
                                    </span>
                                </motion.button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

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


export default PhotoGallery;
