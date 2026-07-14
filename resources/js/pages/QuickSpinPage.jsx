import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import axios from 'axios';
import { Upload, Trophy, Loader2, LogOut, Zap, ArrowLeft, Trash2 } from 'lucide-react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickSpinPage({ auth }) {
  const isSuperAdmin = auth?.user?.roles?.includes('super-admin');
  const urlParams = new URLSearchParams(window.location.search);
  const initialPlatform = urlParams.get('platform') || 'tiktok';
  const [platform, setPlatform] = useState(initialPlatform);
  const [prizes, setPrizes] = useState([]);
  const [selectedPrize, setSelectedPrize] = useState('');

  // Upload
  const [isUploading, setIsUploading] = useState(false);

  // Stats
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [availableParticipants, setAvailableParticipants] = useState(0);

  // Wheel
  const [wheelData, setWheelData] = useState([{ option: '???' }]);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Winner
  const [showWinner, setShowWinner] = useState(false);
  const [winnerName, setWinnerName] = useState(null);
  const [winnersHistory, setWinnersHistory] = useState([]);

  // Event tracking (reuse same event for consecutive spins)
  const [currentEventId, setCurrentEventId] = useState(null);

  useEffect(() => {
    fetchInit();
    fetchPrizes();
  }, [platform]);

  const fetchInit = async () => {
    try {
      const res = await axios.get(`/api/quick-spin/init?platform=${platform}`);
      setTotalParticipants(res.data.total);
      setAvailableParticipants(res.data.available);
      if (res.data.preview_items && res.data.preview_items.length > 0) {
        setWheelData(res.data.preview_items.map(item => ({ option: item })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrizes = async () => {
    try {
      const res = await axios.get('/prizes');
      setPrizes(res.data);
    } catch (err) { console.error(err); }
  };

  const handleUpload = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      setIsUploading(true);
      try {
        await axios.post('/upload-combined', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('Upload berhasil!');
        setWinnersHistory([]);
        setCurrentEventId(null);
        fetchInit();
      } catch (err) {
        alert('Upload gagal!');
      }
      setIsUploading(false);
    };
    fileInput.click();
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    if (!selectedPrize) {
      alert('Pilih hadiah terlebih dahulu!');
      return;
    }
    if (availableParticipants <= 0) {
      alert('Tidak ada peserta tersisa!');
      return;
    }

    setIsSpinning(true);
    try {
      const payload = {
        platform,
        prize_id: selectedPrize,
      };
      if (currentEventId) payload.event_id = currentEventId;

      const res = await axios.post('/api/quick-spin/spin', payload);
      const { receipt_number, prize, wheel_items, winner_index, event_id, history_id, remaining_participants } = res.data;

      setCurrentEventId(event_id);
      setAvailableParticipants(remaining_participants);

      const newWheelData = wheel_items.map(item => ({ option: item }));
      setWheelData(newWheelData);
      setPrizeNumber(winner_index);
      setWinnerName({ receipt: receipt_number, prize, history_id });

      setTimeout(() => {
        setMustSpin(true);
      }, 100);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Spin gagal.');
      setIsSpinning(false);
    }
  };

  const handleStopSpinning = () => {
    setMustSpin(false);
    setIsSpinning(false);
    setShowWinner(true);
  };

  const nextStep = () => {
    setShowWinner(false);
    setWinnersHistory(prev => [...prev, { receipt: winnerName.receipt, prize: winnerName.prize, history_id: winnerName.history_id, step: prev.length + 1 }]);
  };

  const handleDeleteWinner = async (history_id, idx) => {
    if (!window.confirm('Yakin ingin membatalkan/menghapus pemenang ini? Peserta akan dikembalikan ke daftar acak.')) return;
    try {
      await axios.delete(`/histories/${history_id}`);
      setWinnersHistory(prev => prev.filter((_, i) => i !== idx));
      fetchInit(); // Refresh available participants count
      alert('Pemenang berhasil dihapus dan dikembalikan.');
    } catch (err) {
      alert('Gagal menghapus pemenang.');
      console.error(err);
    }
  };

  const themeColors = {
    tiktok: {
      accent: 'text-indigo-500',
      accentBg: 'bg-indigo-500',
      accentHover: 'hover:bg-indigo-600',
      border: 'border-indigo-500/50',
      glow: 'shadow-[0_4px_20px_rgba(79,70,229,0.15)]',
      wheelBg: ['#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#c084fc'],
    },
    shopee: {
      accent: 'text-orange-500',
      accentBg: 'bg-orange-500',
      accentHover: 'hover:bg-orange-600',
      border: 'border-orange-500/50',
      glow: 'shadow-[0_4px_20px_rgba(249,115,22,0.15)]',
      wheelBg: ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#f59e0b'],
    },
  };

  const theme = themeColors[platform] || themeColors.tiktok;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center p-4 md:p-6 bg-gray-200/90 backdrop-blur-md shadow-lg border-b border-gray-300 shadow-gray-300/50">
        <div className="text-2xl font-black tracking-wider text-gray-900 mb-4 md:mb-0 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-amber-500" />
          QUICK<span className="text-amber-500">SPIN</span>
        </div>
        <div className="flex items-center space-x-3">
          <a href={isSuperAdmin ? '/admin' : '/toko'} className="flex items-center text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-white shadow-sm mr-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </a>
          <span className="px-3 py-1 text-xs font-bold rounded-full border bg-amber-100 text-amber-700 border-amber-200 shadow-sm">
            Quick Spin
          </span>
          <button onClick={() => router.post('/logout')} className="flex items-center text-sm font-bold text-gray-600 hover:text-rose-600 transition-colors px-3 py-2 rounded-lg hover:bg-white shadow-sm">
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-[1500px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-8 items-start">

        {/* Left: Wheel */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Control Bar */}
          <div className="w-full bg-white rounded-2xl shadow-md border border-gray-200 p-4 md:p-6 mb-6">
            <div className="flex flex-col xl:flex-row gap-4 items-end">
              {/* Platform Filter */}
              <div className="flex-1 w-full xl:w-auto">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Sumber Data</label>
                <div className="flex bg-gray-100/80 p-1.5 rounded-xl shadow-inner border border-gray-200 w-full h-[48px]">
                  <button onClick={() => {
                    setPlatform('tiktok');
                    setCurrentEventId(null);
                    window.history.replaceState(null, '', '/quick-spin?platform=tiktok');
                  }} className={`flex-1 rounded-lg font-black transition-all text-xs md:text-sm tracking-wide ${platform === 'tiktok' ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 scale-105 z-10' : 'text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-200/50'}`}>TIKTOK</button>
                  <button onClick={() => {
                    setPlatform('shopee');
                    setCurrentEventId(null);
                    window.history.replaceState(null, '', '/quick-spin?platform=shopee');
                  }} className={`flex-1 rounded-lg font-black transition-all text-xs md:text-sm tracking-wide ${platform === 'shopee' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105 z-10' : 'text-gray-500 hover:text-gray-700 bg-transparent hover:bg-gray-200/50'}`}>SHOPEE</button>
                </div>
              </div>
              {/* Upload */}
              <div className="flex-1 w-full xl:w-auto">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Upload Excel (Opsional)</label>
                <button onClick={handleUpload} disabled={isUploading} className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center transition-colors shadow-sm">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {isUploading ? 'Mengunggah...' : 'Upload Excel'}
                </button>
              </div>
              {/* Prize */}
              <div className="flex-1 w-full xl:w-auto">
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Pilih Hadiah</label>
                <select value={selectedPrize} onChange={e => setSelectedPrize(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-amber-400 text-sm font-medium shadow-sm">
                  <option value="">-- Pilih Hadiah --</option>
                  {prizes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              {/* Stats */}
              <div className="flex gap-4 text-center">
                <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  <div className="text-lg font-black text-gray-800">{availableParticipants}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Tersedia</div>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  <div className="text-lg font-black text-gray-800">{winnersHistory.length}</div>
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Pemenang</div>
                </div>
              </div>
            </div>
          </div>

          {/* Wheel */}
          <div className={`relative rounded-full scale-[1.1] sm:scale-[1.2] md:scale-[1.3] lg:scale-[1.35] origin-center my-8 md:my-20 ${theme.glow}`}>
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelData}
              onStopSpinning={handleStopSpinning}
              outerBorderColor="#374151"
              outerBorderWidth={6}
              innerBorderColor="#4b5563"
              innerBorderWidth={3}
              radiusLineColor="#6b7280"
              radiusLineWidth={1}
              textColors={['#f1f5f9']}
              backgroundColors={theme.wheelBg}
              fontSize={12}
              textDistance={45}
              spinDuration={0.6}
              perpendicularText={false}
            />
          </div>

          {/* Spin Button */}
          <div className="mt-4">
            <button
              onClick={handleSpin}
              disabled={isSpinning || mustSpin || !selectedPrize || availableParticipants <= 0}
              className={`${theme.accentBg} ${theme.accentHover} disabled:opacity-40 text-white px-10 py-4 rounded-2xl text-2xl font-black shadow-xl transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center`}
            >
              <Zap className="w-6 h-6 mr-2" />
              {isSpinning ? 'MEMUTAR...' : 'PUTAR'}
            </button>
          </div>
        </div>

        {/* Right: History */}
        <div className="lg:col-span-4 w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-6 flex flex-col h-[700px]">
          <h3 className={`text-lg font-bold mb-4 ${theme.accent} flex items-center justify-center`}>
            <Trophy className="w-5 h-5 mr-2" /> Riwayat Pemenang
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {winnersHistory.length === 0 ? (
              <p className="text-gray-400 text-center mt-20 italic text-sm">Belum ada pemenang. Putar roda untuk memulai!</p>
            ) : (
                  winnersHistory.map((w, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={w.step}
                  className="bg-gray-50 border border-gray-200 p-4 rounded-xl relative shadow-sm"
                >
                  <span className={`absolute -top-2 -left-2 ${theme.accentBg} text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md`}>
                    #{w.step}
                  </span>
                  <div className="flex justify-between items-start mt-1">
                    <div className="font-mono text-lg font-bold text-gray-800">{w.receipt}</div>
                    <button onClick={() => handleDeleteWinner(w.history_id, idx)} className="text-gray-400 hover:text-rose-500 transition-colors p-1" title="Batalkan Pemenang (Hapus)">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className={`${theme.accent} font-medium text-xs mt-1 flex items-center`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${theme.accentBg} mr-1.5`}></div>
                    {w.prize}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Winner Modal */}
      <AnimatePresence>
        {showWinner && winnerName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white p-8 md:p-12 rounded-[2rem] max-w-xl w-full text-center border border-gray-200 shadow-2xl"
            >
              <Trophy className="w-20 h-20 text-amber-400 mx-auto mb-4 drop-shadow-lg" />
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-1">Selamat!</h2>
              <p className={`text-lg ${theme.accent} mb-6 font-medium`}>Pemenang #{winnersHistory.length + 1}</p>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6 inline-block min-w-[80%]">
                <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">No. Resi</div>
                <div className="text-2xl md:text-3xl font-mono font-black text-gray-900 mb-3">
                  {winnerName.receipt}
                </div>
                <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1 mt-4">Hadiah</div>
                <div className="text-xl md:text-2xl font-black text-amber-500">
                  {winnerName.prize}
                </div>
              </div>

              <div>
                <button
                  onClick={nextStep}
                  className={`${theme.accentBg} ${theme.accentHover} text-white px-8 py-3 rounded-xl font-bold text-lg transition-colors shadow-lg`}
                >
                  Lanjut Putar Lagi
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
