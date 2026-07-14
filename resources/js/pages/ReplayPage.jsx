import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import { Trophy, ArrowLeft, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function ReplayPage({ history, wheelItems, winnerIndex }) {
  const [mustSpin, setMustSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [wheelData, setWheelData] = useState([]);
  const [stats, setStats] = useState({ total: 0, winners: 0 });

  useEffect(() => {
    // Initialize wheel data from props
    const formattedData = wheelItems.map((item, i) => ({
      option: item,
      style: { backgroundColor: i % 2 === 0 ? '#1f2937' : '#374151', textColor: '#f3f4f6' }
    }));
    setWheelData(formattedData);

    // Fetch stats for this platform
    axios.get(`/stats?platform=${history.platform}`)
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, [wheelItems, history.platform]);

  const handleSpinClick = () => {
    if (mustSpin || isSpinning) return;
    setIsSpinning(true);
    setShowWinner(false);

    // Clear any previous highlights
    const resetData = wheelItems.map((item, i) => ({
      option: item,
      style: { backgroundColor: i % 2 === 0 ? '#1f2937' : '#374151', textColor: '#f3f4f6' }
    }));
    setWheelData(resetData);

    setTimeout(() => {
      setMustSpin(true);
    }, 100);
  };

  const themeColor = history.platform === 'tiktok' ? 'bg-gray-900' : 'bg-stone-900';

  return (
    <div className={`min-h-screen ${themeColor} text-gray-200 transition-colors duration-500 flex flex-col font-sans overflow-hidden`}>
      <header className="p-4 md:p-6 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 shadow-lg flex justify-between items-center relative z-30">
        <a href="/" className="flex items-center text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
          <ArrowLeft className="mr-2 w-5 h-5" /> Kembali
        </a>
        <div className="w-20"></div> {/* Spacer for center alignment */}
      </header>

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start overflow-hidden">
        
        {/* LEFT PANEL: DATA PESERTA (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6 w-full relative z-20">
          <div className="bg-gray-800 p-4 md:p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-100"><Users className="mr-2 text-indigo-400" /> Data Peserta</h2>
            
            <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 font-medium">Platform:</span>
                <span className="font-bold text-lg text-gray-200 uppercase">{history.platform}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400 font-medium">Total Resi:</span>
                <span className="font-bold text-xl text-gray-200">{stats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-medium">Pemenang:</span>
                <span className="font-bold text-xl text-indigo-400">{stats.winners}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: WHEEL (col-span-6) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[400px] md:min-h-[500px] py-10 w-full overflow-hidden">
          {wheelData.length > 1 && (
            <div className="relative transform scale-125 sm:scale-150 md:scale-[1.6] lg:scale-[1.75] mt-32 mb-40">
              <div>
                <div className="relative">
                  <Wheel
                    mustStartSpinning={mustSpin}
                    pointerProps={{ style: { transform: 'scale(0.5)', transformOrigin: 'center' } }}
                    prizeNumber={winnerIndex}
                    startingOptionIndex={winnerIndex}
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
                    onStopSpinning={() => {
                      setMustSpin(false);
                      setIsSpinning(false);

                      // Highlight the winner slice
                      const newData = [...wheelData];
                      newData[winnerIndex].style = { backgroundColor: '#4f46e5', textColor: '#ffffff' };
                      setWheelData(newData);

                      setShowWinner(true);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSpinClick}
            disabled={mustSpin || isSpinning}
            className="mt-8 px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-2xl rounded-full shadow-[0_4_20px_rgba(79,70,229,0.5)] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 border border-indigo-500 z-40"
          >
            SPIN
          </button>

          {/* Winner Popup */}
          <AnimatePresence>
            {showWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-3xl"
              >
                <div className="bg-gray-800 p-10 rounded-3xl text-center text-gray-200 shadow-2xl border border-gray-700 min-w-[320px]">
                  <Trophy className="w-20 h-20 mx-auto mb-4 text-indigo-400" />
                  <h2 className="text-3xl font-black mb-2 text-gray-100">SELAMAT!</h2>
                  <p className="text-lg font-medium mb-4 text-gray-400">Pemenang Resi (Replay):</p>
                  <div className="bg-gray-900 text-indigo-400 text-4xl font-mono p-4 rounded-xl font-bold tracking-widest mb-8 border border-gray-700 shadow-inner">
                    {history.receipt_number}
                  </div>
                  <button onClick={() => setShowWinner(false)} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition-colors shadow-lg">
                    Tutup
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PANEL: HADIAH (col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-6 w-full relative z-20">
          <div className="bg-gray-800 p-4 md:p-6 rounded-2xl border border-gray-700 shadow-xl flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-100"><Trophy className="mr-2 text-indigo-400" /> Hadiah Replay</h2>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 text-center flex flex-col items-center justify-center min-h-[150px]">
               <Trophy className="w-16 h-16 text-indigo-500 mb-4" />
               <span className="font-bold text-xl text-gray-200">{history.prize_name}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
