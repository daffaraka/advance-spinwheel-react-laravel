import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import axios from 'axios';
import { Trophy, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContentSpinPage({ sequence_uuid, sequence_title }) {
  const [sequenceData, setSequenceData] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [mustSpin, setMustSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [wheelData, setWheelData] = useState(Array.from({ length: 100 }, (_, i) => ({ option: 'TX' + (Math.floor(Math.random() * 90000) + 10000) })));
  const [winnerName, setWinnerName] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [winnersHistory, setWinnersHistory] = useState([]);

  useEffect(() => {
    fetchSequence();
  }, []);

  const fetchSequence = async () => {
    try {
      const res = await axios.get(`/api/content-spin/sequence/${sequence_uuid}`);
      setSequenceData(res.data);
      setIsLoading(false);
    } catch (err) {
      setError('Gagal memuat sesi konten. Link mungkin tidak valid.');
      setIsLoading(false);
    }
  };

  const handleSpinClick = async () => {
    if (mustSpin || isSpinning || showWinner) return;
    if (currentStepIndex >= sequenceData.sequence_data.length) {
      setIsFinished(true);
      return;
    }

    setIsSpinning(true);
    setMustSpin(false);

    try {
      const res = await axios.post(`/api/content-spin/sequence/${sequence_uuid}/execute`, {
        step_index: currentStepIndex
      });

      const { receipt_number, prize, wheel_items, winner_index } = res.data;
      
      const newWheelData = wheel_items.map(item => ({ option: item }));
      setWheelData(newWheelData);
      setPrizeNumber(winner_index);
      setWinnerName({ receipt: receipt_number, prize: prize });

      setTimeout(() => {
        setMustSpin(true);
      }, 100);

    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.msg || 'Terjadi kesalahan saat memutar roda.');
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
    setWinnersHistory(prev => [...prev, { receipt: winnerName.receipt, prize: winnerName.prize, step: currentStepIndex + 1 }]);
    setCurrentStepIndex(prev => prev + 1);
    if (currentStepIndex + 1 >= sequenceData.sequence_data.length) {
      setIsFinished(true);
    }
  };

  const handleAddRandomSpin = async () => {
    setIsSpinning(true);
    setIsFinished(false);
    try {
      const res = await axios.post(`/api/content-spin/sequence/${sequence_uuid}/add-random`);
      
      const { receipt_number, prize, wheel_items, winner_index, sequence_data } = res.data;
      
      setSequenceData(prev => ({ ...prev, sequence_data }));
      
      const newWheelData = wheel_items.map(item => ({ option: item }));
      setWheelData(newWheelData);
      setPrizeNumber(winner_index);
      setWinnerName({ receipt: receipt_number, prize: prize });

      setTimeout(() => {
        setMustSpin(true);
      }, 100);
      
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.msg || 'Terjadi kesalahan saat memutar roda acak.');
      setIsSpinning(false);
      setIsFinished(true);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-rose-500 font-bold">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 font-sans text-gray-200 overflow-x-hidden selection:bg-indigo-500/30">
      <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 mb-10 mt-10">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-rose-400 text-transparent bg-clip-text">
            {sequence_title}
          </h1>
          <p className="text-gray-400 text-lg">
            Putaran ke-{Math.min(currentStepIndex + 1, sequenceData.sequence_data.length)} dari {sequenceData.sequence_data.length}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start justify-center py-10 lg:py-16 overflow-hidden max-w-[1200px] mx-auto">
          {/* Wheel Container - Left */}
          <div className="lg:col-span-8 flex flex-col items-center w-full">
            <div className="relative w-full aspect-square flex items-center justify-center max-w-[700px] mx-auto mb-8">
              <div className="relative transform scale-125 sm:scale-150 md:scale-[1.6] lg:scale-[1.8] xl:scale-[1.9] w-full h-full flex justify-center items-center">
                <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  pointerProps={{ style: { transform: 'scale(0.5)', transformOrigin: 'center' } }}
                  data={wheelData}
                  backgroundColors={['#1f2937', '#374151']}
                  textColors={['#f3f4f6']}
                  outerBorderColor="#4b5563"
                  outerBorderWidth={5}
                  innerBorderColor="#4b5563"
                  innerRadius={10}
                  radiusLineColor="#4b5563"
                  radiusLineWidth={1}
                  fontSize={8}
                  spinDuration={0.8}
                  onStopSpinning={handleStopSpinning}
                />
              </div>
            </div>

            <div className="text-center mt-20 md:mt-24 w-full relative z-10 flex flex-col items-center justify-center gap-4">
              {isFinished ? (
                <>
                  <div className="bg-emerald-900/40 text-emerald-400 p-6 rounded-2xl border border-emerald-800 inline-block">
                    <h2 className="text-2xl font-bold mb-2">Sesi Konten Selesai!</h2>
                    <p className="text-sm text-emerald-300">Semua urutan putaran telah dijalankan.</p>
                  </div>
                  <button
                    onClick={handleAddRandomSpin}
                    disabled={mustSpin || isSpinning || showWinner}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl text-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed mt-2"
                  >
                    + Tambah Putaran Acak Baru
                  </button>
                </>
              ) : (
                <button
                  onClick={handleSpinClick}
                  disabled={mustSpin || isSpinning || showWinner}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-white px-10 py-4 rounded-2xl text-2xl font-black shadow-[0_0_40px_-10px_rgba(192,132,252,0.5)] transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  {isSpinning ? 'MEMUTAR...' : 'PUTAR RODA'}
                </button>
              )}
            </div>
          </div>

          {/* History Card - Right */}
          <div className="lg:col-span-4 w-full bg-gray-800/80 backdrop-blur-md rounded-3xl border border-gray-700 shadow-2xl p-6 flex flex-col h-[650px]">
            <h3 className="text-xl font-bold mb-6 text-fuchsia-400 flex items-center justify-center">
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
                    className="bg-gray-900 border border-gray-700 p-5 rounded-2xl relative shadow-lg"
                  >
                    <span className="absolute -top-3 -left-3 bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg border-2 border-gray-900">
                      #{w.step}
                    </span>
                    <div className="font-mono text-2xl font-bold text-gray-200 mt-1">{w.receipt}</div>
                    {w.prize !== 'Ucapan Selamat' && (
                      <div className="text-fuchsia-400 font-medium text-sm mt-2 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-fuchsia-500 mr-2"></div>
                        {w.prize}
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gray-800 p-8 md:p-12 rounded-[2rem] max-w-2xl w-full text-center border-2 border-indigo-500 shadow-[0_0_100px_-20px_rgba(99,102,241,0.5)] relative overflow-hidden"
            >
              {/* Confetti effect background (simplified) */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
              
              <div className="relative z-10">
                <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <h2 className="text-4xl md:text-5xl font-black text-white mb-2 uppercase tracking-wider">Selamat!</h2>
                <p className="text-xl text-indigo-300 mb-8 font-medium">Pemenang Putaran Ini</p>
                
                <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-700 mb-8 inline-block min-w-[80%]">
                  <div className="text-indigo-400 text-sm font-bold tracking-widest uppercase mb-1">No. Resi</div>
                  <div className="text-3xl md:text-4xl font-mono font-black text-white mb-4">
                    {winnerName.receipt}
                  </div>
                  
                  {winnerName.prize !== 'Ucapan Selamat' && (
                    <>
                      <div className="text-fuchsia-400 text-sm font-bold tracking-widest uppercase mb-1 mt-6">Mendapatkan Hadiah</div>
                      <div className="text-2xl md:text-3xl font-black text-yellow-400">
                        {winnerName.prize}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <button
                    onClick={nextStep}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-indigo-500/25"
                  >
                    Lanjut ke Putaran Berikutnya
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
