import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import axios from 'axios';
import { Trophy, Loader2, Upload, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const platformThemes = {
  tiktok: {
    bg: 'bg-gray-50',
    accent: 'text-indigo-400',
    accentBg: 'bg-indigo-500/80',
    accentHover: 'hover:bg-indigo-500',
    border: 'border-indigo-500/50',
    glow: 'shadow-[0_4_20px_rgba(79,70,229,0.3)]',
    label: 'TikTok Live Spin',
  },
  shopee: {
    bg: 'bg-stone-50',
    accent: 'text-orange-400',
    accentBg: 'bg-orange-500/80',
    accentHover: 'hover:bg-orange-500',
    border: 'border-orange-500/50',
    glow: 'shadow-[0_4_20px_rgba(249,115,22,0.3)]',
    label: 'Shopee Live Spin',
  },
  mix: {
    bg: 'bg-slate-50',
    accent: 'text-slate-800',
    accentBg: 'bg-slate-800/80',
    accentHover: 'hover:bg-slate-900',
    border: 'border-slate-800/50',
    glow: 'shadow-[0_4px_20px_rgba(15,23,42,0.3)]',
    label: 'Mixed Live Spin',
  },
};

export default function LiveSpinPage({ platform, event }) {
  const theme = platformThemes[platform] || platformThemes.tiktok;

  const [eventData, setEventData] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [wheelData, setWheelData] = useState([{ option: '???' }]);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [mustSpin, setMustSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerName, setWinnerName] = useState(null);
  const [winnersHistory, setWinnersHistory] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [remaining, setRemaining] = useState(0);

  // Prize selection for events without prize
  const [prizes, setPrizes] = useState([]);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [selectedLivePrize, setSelectedLivePrize] = useState('');

  // Fake Upload state
  const [isUploading, setIsUploading] = useState(false);
  const handleFakeUpload = () => {
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 1500);
  };

  useEffect(() => {
    fetchEvents();
    fetchPrizes();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`/api/live/${platform}/${event.slug}/events`);
      setEventData(res.data.events);
      setRemaining(res.data.events.length);
      if (res.data.events.length === 0) {
        setIsFinished(true);
        setSelectedEventId(null);
      } else {
        setSelectedEventId(prev => {
          if (res.data.events.some(e => e.id === prev)) return prev;
          return res.data.events[0].id;
        });
      }

      if (res.data.initial_wheel && res.data.initial_wheel.length > 0) {
        setWheelData(res.data.initial_wheel.map(item => ({ option: item })));
      }

      if (res.data.history) {
        setWinnersHistory(res.data.history);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrizes = async () => {
    try {
      const res = await axios.get('/api/prizes');
      setPrizes(res.data);
    } catch (err) { console.error(err); }
  };

  const currentEvent = eventData.find(e => e.id === selectedEventId) || eventData[0];

  const handleSpin = async () => {
    if (isSpinning || isFinished) return;

    // Check if current event has a prize set
    if (currentEvent && !currentEvent.prize_id) {
      setShowPrizeModal(true);
      return;
    }

    executeSpin();
  };

  const executeSpin = async (overridePrizeId) => {
    setIsSpinning(true);
    setShowPrizeModal(false);

    try {
      const payload = {};
      if (selectedEventId) payload.detail_id = selectedEventId;
      if (overridePrizeId) payload.prize_id = overridePrizeId;

      const res = await axios.post(`/api/live/${platform}/${event.slug}/spin`, payload);
      const { receipt_number, prize, wheel_items, winner_index, remaining: rem } = res.data;

      const newWheelData = wheel_items.map(item => ({ option: item }));
      setWheelData(newWheelData);
      setPrizeNumber(winner_index);
      setWinnerName({ receipt: receipt_number, prize });
      setRemaining(rem);

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
    setWinnersHistory(prev => [...prev, { receipt: winnerName.receipt, prize: winnerName.prize, step: prev.length + 1 }]);
    fetchEvents(); // Re-fetch to get updated pending slots
  };

  return (
    <div className={`min-h-screen ${theme.bg} text-gray-800 font-sans`}>
      {/* Header */}
      <div className="text-center pt-16 pb-8">
        <h1 className={`text-3xl md:text-5xl font-black ${theme.accent} tracking-wider mb-2`}>
          {event.name}
        </h1>
        <p className="text-gray-600 font-bold uppercase tracking-widest">{theme.label}</p>
        {/* Pending Slots Selection */}
        {!isFinished && eventData.length > 0 && (
          <div className="mt-8 mb-4 max-w-[1200px] mx-auto overflow-x-auto red-scrollbar pb-4 px-4 flex gap-4 snap-x">
            {eventData.map((evItem, idx) => (
              <button
                key={evItem.id}
                onClick={() => setSelectedEventId(evItem.id)}
                className={`snap-center flex-shrink-0 w-48 text-left rounded-2xl p-4 transition-all border-2 relative overflow-hidden group ${
                  selectedEventId === evItem.id 
                    ? `${theme.border} ${theme.accentBg} shadow-xl scale-105 text-white` 
                    : 'border-pink-200 bg-pink-50 hover:bg-pink-100 hover:border-pink-300 hover:shadow-md opacity-80 hover:opacity-100 text-gray-800'
                }`}
              >
                <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${selectedEventId === evItem.id ? 'text-white/80' : 'text-gray-500'}`}>Slot Tersedia</div>
                <div className={`font-bold truncate`}>
                  {evItem.prize ? evItem.prize.name : 'Belum Dipilih'}
                </div>
              </button>
            ))}
          </div>
        )}

        {currentEvent && !isFinished && (
          <motion.div
            key={selectedEventId}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3"
          >
            {currentEvent.prize ? (
              <p className={`text-2xl font-black ${theme.accent} mt-1`}>{currentEvent.prize.name}</p>
            ) : (
              <p className="text-lg text-amber-400/80 mt-1 font-medium">Hadiah belum dipilih — pilih saat spin</p>
            )}
          </motion.div>
        )}
        {isFinished && (
          <p className="text-gray-600 mt-3 text-lg font-medium">Semua Event Selesai</p>
        )}
      </div>

      {/* Main Grid */}
      <div className="max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 px-4 md:px-8 items-start pb-8">
        {/* Wheel - Left */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div className={`relative rounded-full scale-[1.15] sm:scale-[1.25] md:scale-[1.35] lg:scale-[1.4] origin-center my-12 md:my-24 ${theme.glow}`}>
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={wheelData}
              onStopSpinning={handleStopSpinning}
              outerBorderColor="#1e293b"
              outerBorderWidth={8}
              innerBorderColor="#334155"
              innerBorderWidth={4}
              radiusLineColor="#475569"
              radiusLineWidth={1}
              textColors={['#f1f5f9']}
              backgroundColors={['#6366f1', '#8b5cf6', '#a78bfa', '#818cf8', '#c084fc']}
              fontSize={14}
              textDistance={45}
              spinDuration={0.6}
              perpendicularText={false}
            />
          </div>

          {/* Spin Button */}
          <div className="mt-6">
            {!isFinished ? (
              <button
                onClick={handleSpin}
                disabled={isSpinning || mustSpin}
                className={`${theme.accentBg} ${theme.accentHover} disabled:opacity-50 text-white px-10 py-4 rounded-2xl text-2xl font-black shadow-xl transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed`}
              >
                {isSpinning ? 'MEMUTAR...' : 'PUTAR RODA'}
              </button>
            ) : (
              <div className="text-center text-gray-600/80 text-xl font-medium py-4">
                Semua event sudah diputar

              </div>
            )}
          </div>

        </div>

        {/* History Card - Right */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Fake Upload Block */}
          <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-gray-300 shadow-xl flex flex-col gap-2">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Excel (Opsional)</label>
            
            <input 
              type="file" 
              id="fake-upload" 
              className="hidden" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={(e) => {
                if(e.target.files && e.target.files.length > 0) {
                  handleFakeUpload();
                  e.target.value = null; // Reset input
                }
              }} 
            />
            
            <label 
              htmlFor="fake-upload" 
              className={`w-full bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center transition-colors shadow-sm cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              {isUploading ? 'Mengunggah...' : 'Upload Excel'}
            </label>
          </div>

          <div className="w-full bg-white/80 backdrop-blur-md rounded-3xl border border-gray-300 shadow-2xl p-6 flex flex-col h-[650px]">
            <h3 className={`text-xl font-bold mb-6 ${theme.accent} flex items-center justify-center`}>
              <Trophy className="w-5 h-5 mr-2" /> Riwayat Pemenang
            </h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {winnersHistory.length === 0 ? (
                <p className="text-gray-500 text-center mt-20 italic">Belum ada pemenang sesi ini.</p>
              ) : (
                winnersHistory.map((w, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={w.step}
                    className="bg-gray-50 border border-gray-300 p-5 rounded-2xl relative shadow-lg"
                  >
                    <span className={`absolute -top-3 -left-3 ${theme.accentBg} text-white text-xs font-black px-3 py-1 rounded-full shadow-lg border-2 border-gray-900`}>
                      #{w.step}
                    </span>
                    <div className="font-mono text-2xl font-bold text-gray-800 mt-1">{w.receipt}</div>
                    <div className={`${theme.accent} font-medium text-sm mt-2 flex items-center`}>
                      <div className={`w-2 h-2 rounded-full ${theme.accentBg} mr-2`}></div>
                      {w.prize}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Prize Selection Modal */}
      <AnimatePresence>
        {showPrizeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-2xl max-w-md w-full border border-gray-300 shadow-2xl"
            >
              <h3 className={`text-xl font-bold mb-4 ${theme.accent}`}>Pilih Hadiah untuk Putaran Ini</h3>
              <p className="text-gray-600 text-sm mb-6">Event ini belum memiliki hadiah. Pilih hadiah sebelum memutar roda.</p>
              <select
                value={selectedLivePrize}
                onChange={(e) => setSelectedLivePrize(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 mb-6"
              >
                <option value="">-- Pilih Hadiah --</option>
                {prizes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPrizeModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (!selectedLivePrize) return alert('Pilih hadiah terlebih dahulu!');
                    executeSpin(selectedLivePrize);
                    setSelectedLivePrize('');
                  }}
                  disabled={!selectedLivePrize}
                  className={`flex-1 ${theme.accentBg} ${theme.accentHover} disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors shadow-lg`}
                >
                  Putar Roda!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Modal */}
      <AnimatePresence>
        {showWinner && winnerName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className={`bg-white p-8 md:p-12 rounded-[2rem] max-w-2xl w-full text-center border-2 ${theme.border} shadow-2xl relative overflow-hidden`}
            >
              <div className="relative z-10">
                <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h2 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-wider">Selamat!</h2>
                <p className={`text-xl ${theme.accent} mb-8 font-medium`}>Pemenang Putaran #{winnersHistory.length + 1}</p>

                <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-300 mb-8 inline-block min-w-[80%]">
                  <div className={`${theme.accent} text-sm font-bold tracking-widest uppercase mb-1`}>No. Resi</div>
                  <div className="text-3xl md:text-4xl font-mono font-black text-gray-900 mb-4">
                    {winnerName.receipt}
                  </div>

                  <div className={`${theme.accent} text-sm font-bold tracking-widest uppercase mb-1 mt-6`}>Mendapatkan Hadiah</div>
                  <div className="text-2xl md:text-3xl font-black text-yellow-400">
                    {winnerName.prize}
                  </div>
                </div>

                <div>
                  <button
                    onClick={nextStep}
                    className={`${theme.accentBg} ${theme.accentHover} text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg`}
                  >
                    {remaining > 0 ? 'Lanjut ke Putaran Berikutnya' : 'Selesai'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
