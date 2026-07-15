import React, { useState, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import axios from 'axios';
import { Upload, Trophy, Users, Loader2, Search, Filter, ChevronLeft, ChevronRight, History, Trash2, LogOut, ListOrdered, Plus, Zap, Save } from 'lucide-react';
import { router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SpinwheelPage({ auth }) {
  const [platform, setPlatform] = useState('tiktok');
  const [prizes, setPrizes] = useState([]);

  const isSuperAdmin = auth?.user?.roles?.includes('super-admin');
  const [selectedPrize, setSelectedPrize] = useState(null);
  const [stats, setStats] = useState({ total: 0, winners: 0 });
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [spinTitle, setSpinTitle] = useState('');

  // History states
  const [histories, setHistories] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterPrize, setFilterPrize] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Live search states
  const [riggedSearchQuery, setRiggedSearchQuery] = useState('');
  const [riggedSearchResults, setRiggedSearchResults] = useState([]);
  const [selectedRiggedReceipt, setSelectedRiggedReceipt] = useState('');
  const [isSearchingRigged, setIsSearchingRigged] = useState(false);

  // History Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingHistory, setEditingHistory] = useState(null);
  const [newHistoryTitle, setNewHistoryTitle] = useState('');
  const [newHistoryPrize, setNewHistoryPrize] = useState('');
  const [newHistorySearchQuery, setNewHistorySearchQuery] = useState('');
  const [newHistorySearchResults, setNewHistorySearchResults] = useState([]);
  const [selectedNewHistoryReceipt, setSelectedNewHistoryReceipt] = useState('');
  const [isSearchingNewHistory, setIsSearchingNewHistory] = useState(false);
  const [newHistoryIsRigged, setNewHistoryIsRigged] = useState(false);
  const [isCreatingHistory, setIsCreatingHistory] = useState(false);

  // Content Sequence states
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [sequenceTitle, setSequenceTitle] = useState('');
  const [sequenceItems, setSequenceItems] = useState([]);
  const [isCreatingSequence, setIsCreatingSequence] = useState(false);
  const [createdSequenceUrl, setCreatedSequenceUrl] = useState('');

  // Event states (Master-Detail)
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'event'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadClearOld, setUploadClearOld] = useState('yes');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [events, setEvents] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [isLoadingEventDetails, setIsLoadingEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState([]);
  const [eventPlatform, setEventPlatform] = useState('tiktok');

  const [newEventName, setNewEventName] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  const [eventSlotCount, setEventSlotCount] = useState(1);
  const [isAddingEvents, setIsAddingEvents] = useState(false);
  const [participantSearch, setParticipantSearch] = useState({});
  const [participantResults, setParticipantResults] = useState({});


  //Prizes States (Master Price)


  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [isPrizesLoading, setIsPrizesLoading] = useState(false);
  const [editPrize, setEditPrize] = useState(null);
  const [prizeForm, setPrizeForm] = useState({
    name: '',
    stock: 0
  })


  // Efek ini bertugas mengisi form otomatis JIKA kamu menekan tombol Edit
  useEffect(() => {
    if (editPrize) {
      setPrizeForm({
        name: editPrize.name,
        stock: editPrize.stock
      });
      setIsPrizeModalOpen(true); // Biar modal terbuka
    }
  }, [editPrize]);


  // Wheel states
  const [mustSpin, setMustSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [wheelData, setWheelData] = useState([{ option: '???' }]);
  const [winnerName, setWinnerName] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [isWheelFadingOut, setIsWheelFadingOut] = useState(false);

  useEffect(() => {
    fetchPrizes();
  }, []);

  useEffect(() => {
    if (activeTab === 'event') fetchEvents();
  }, [activeTab, eventPlatform]);

  useEffect(() => {
    setHistoryPage(1);
  }, [filterMonth, filterPrize, searchQuery, platform]);

  // Reset form states when platform changes
  useEffect(() => {
    setSpinTitle('');
    setRiggedSearchQuery('');
    setSelectedRiggedReceipt('');
    setFile(null);
  }, [platform]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStats();
      fetchHistories();
      setShowWinner(false);
      setMustSpin(false);
      setIsSpinning(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [platform, historyPage, filterMonth, filterPrize, searchQuery]);

  const fetchPrizes = async () => {
    try {
      const res = await axios.get('/prizes');
      setPrizes(res.data);
      if (res.data.length > 0 && !selectedPrize) setSelectedPrize(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/events', { params: { platform: eventPlatform } });
      setEvents(res.data);
    } catch (err) { console.error(err); }
  };

  const handleUploadData = async (e) => {
    e.preventDefault();
    if (!uploadFile) { alert('Pilih file Excel/CSV terlebih dahulu!'); return; }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('clear_old', uploadClearOld);

    setIsUploading(true);
    try {
      const res = await axios.post('/upload-combined', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Upload berhasil! (Perhatian: Tidak ada error foreign key karena data di-set null)');
      if (res.data.filename) setUploadedFileName(res.data.filename);
      setShowUploadModal(false);
      setUploadFile(null);
      fetchStats();
      if (activeTab === 'history') fetchHistories();
    } catch (err) {
      alert('Upload gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    setIsCreatingEvent(true);
    try {
      await axios.post('/events', { name: newEventName, platform: eventPlatform });
      setNewEventName('');
      await fetchEvents();
    } catch (err) { console.error(err); }
    setIsCreatingEvent(false);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Hapus event utama ini beserta seluruh slotnya?')) return;
    try {
      await axios.delete(`/events/${id}`);
      if (expandedEventId === id) setExpandedEventId(null);
      await fetchEvents();
    } catch (err) { console.error(err); }
  };

  const fetchEventDetails = async (eventId) => {
    try {
      const res = await axios.get(`/events/${eventId}/details`);
      setEventDetails(res.data);
    } catch (err) { console.error(err); }
  };

  const handleToggleExpand = async (ev) => {
    if (expandedEventId === ev.id) {
      setExpandedEventId(null);
      setEventDetails([]);
    } else {
      setExpandedEventId(ev.id);
      setIsLoadingEventDetails(true);
      await fetchEventDetails(ev.id);
      setIsLoadingEventDetails(false);
    }
  };

  const handleBulkCreateEventDetails = async () => {
    if (!expandedEventId || eventSlotCount < 1) return;
    setIsAddingEvents(true);
    try {
      const res = await axios.post(`/events/${expandedEventId}/details/bulk`, { count: eventSlotCount });
      setEventDetails(res.data);
      setEventSlotCount(1);
      await fetchEvents(); // Update pending count in parent
    } catch (err) { console.error(err); }
    setIsAddingEvents(false);
  };

  const handleUpdateEventDetail = async (id, field, value) => {
    try {
      await axios.put(`/event-details/${id}`, { [field]: value || null });
      await fetchEventDetails(expandedEventId);
    } catch (err) { console.error(err); }
  };

  const handleDeleteEventDetail = async (id) => {
    if (!confirm('Hapus slot ini?')) return;
    try {
      await axios.delete(`/event-details/${id}`);
      await fetchEventDetails(expandedEventId);
      await fetchEvents(); // Update pending count in parent
    } catch (err) { console.error(err); }
  };

  const searchParticipantsForEvent = async (eventId, query) => {
    setParticipantSearch(prev => ({ ...prev, [eventId]: query }));
    if (query.length < 2) { setParticipantResults(prev => ({ ...prev, [eventId]: [] })); return; }
    try {
      const res = await axios.get('/participants/search', { params: { q: query, platform: eventPlatform } });
      setParticipantResults(prev => ({ ...prev, [eventId]: res.data }));
    } catch (err) { console.error(err); }
  };

  const fetchHistories = async () => {
    try {
      const res = await axios.get('/histories', {
        params: {
          platform,
          page: historyPage,
          month: filterMonth,
          prize: filterPrize,
          search: searchQuery
        }
      });
      setHistories(res.data.data);
      setTotalPages(res.data.last_page);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async (keepWheel = false) => {
    try {
      const res = await axios.get(`/stats?platform=${platform}`);
      setStats(res.data);
      if (!keepWheel) {
        if (res.data.preview_items && res.data.preview_items.length > 0) {
          const initialWheel = res.data.preview_items.map((item, i) => ({
            option: item,
            style: { backgroundColor: i % 2 === 0 ? '#1f2937' : '#374151', textColor: '#f3f4f6' }
          }));
          setWheelData(initialWheel);
        } else {
          setWheelData([{ option: '???' }]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('Pilih file dulu!');
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('/upload-combined', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Upload berhasil!');
      fetchStats();
      setFile(null);
    } catch (err) {
      alert('Upload gagal!');
    }
    setIsUploading(false);
  };

  // const handleSpinClick = async () => {
  //   if (!spinTitle.trim()) return alert('Isi Judul Spinwheel terlebih dahulu!');
  //   if (!selectedPrize) return alert('Pilih hadiah dulu!');
  //   if (mustSpin || isSpinning) return;

  //   setIsSpinning(true);
  //   setShowWinner(false);

  //   try {
  //     const res = await axios.post('/spin', {
  //       platform,
  //       prize_id: selectedPrize,
  //       title: spinTitle,
  //       rigged_receipt: selectedRiggedReceipt
  //     });

  //     const { receipt_number: winnerReceipt, wheel_items: items, winner_index: winnerIndex } = res.data;

  //     const newWheelData = items.map((item, i) => {
  //       return { option: item, style: { backgroundColor: i % 2 === 0 ? '#1f2937' : '#374151', textColor: '#f3f4f6' } };
  //     });

  //     setWheelData(newWheelData);
  //     setPrizeNumber(winnerIndex);
  //     setWinnerName(winnerReceipt);

  //     // Delay starting the spin slightly so state updates first
  //     setTimeout(() => {
  //       setMustSpin(true);
  //     }, 100);

  //   } catch (err) {
  //     alert(err.response?.data?.error || 'Gagal melakukan spin');
  //     setIsSpinning(false);
  //   }
  // };

  const handleCreateHistory = async () => {
    if (!newHistoryTitle.trim() || !newHistoryPrize || !selectedNewHistoryReceipt) {
      return alert('Mohon lengkapi semua data!');
    }
    setIsCreatingHistory(true);
    try {
      await axios.post('/histories', {
        title: newHistoryTitle,
        platform,
        receipt_number: selectedNewHistoryReceipt,
        prize_id: newHistoryPrize,
        is_rigged: newHistoryIsRigged
      });
      alert('Riwayat berhasil ditambahkan!');
      setShowCreateModal(false);
      fetchHistories();
      fetchStats(true);

      // reset form
      setNewHistoryTitle('');
      setNewHistoryPrize('');
      setSelectedNewHistoryReceipt('');
      setNewHistorySearchQuery('');
      setNewHistoryIsRigged(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menambahkan riwayat');
    }
    setIsCreatingHistory(false);
  };

  const handleEditHistory = (h) => {
    setEditingHistory(h);
    setNewHistoryTitle(h.title);
    setNewHistoryPrize(h.prize_id);
    setNewHistoryIsRigged(!!h.is_rigged);
    setShowEditModal(true);
  };

  const handleUpdateHistory = async () => {
    if (!newHistoryTitle.trim() || !newHistoryPrize) {
      return alert('Mohon lengkapi judul dan hadiah!');
    }
    setIsCreatingHistory(true);
    try {
      await axios.put(`/histories/${editingHistory.id}`, {
        title: newHistoryTitle,
        prize_id: newHistoryPrize,
        is_rigged: newHistoryIsRigged,
      });
      alert('Riwayat berhasil diupdate!');
      setShowEditModal(false);
      fetchHistories();

      // reset form
      setNewHistoryTitle('');
      setNewHistoryPrize('');
      setNewHistoryIsRigged(false);
      setEditingHistory(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal mengupdate riwayat');
    }
    setIsCreatingHistory(false);
  };

  const handleAddSequenceItem = (type) => {
    setSequenceItems([...sequenceItems, { id: Date.now(), type, history_id: '', receipt_number: '', prize_id: '' }]);
  };

  const handleUpdateSequenceItem = (id, field, value) => {
    setSequenceItems(sequenceItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveSequenceItem = (id) => {
    setSequenceItems(sequenceItems.filter(item => item.id !== id));
  };

  const handleCreateSequence = async () => {
    if (!sequenceTitle.trim() || sequenceItems.length === 0) return alert('Lengkapi judul dan minimal 1 putaran');
    setIsCreatingSequence(true);
    try {
      const res = await axios.post('/content-spin/sequence', {
        title: sequenceTitle,
        sequence_data: sequenceItems
      });
      setCreatedSequenceUrl(res.data.url);
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat sesi konten');
    }
    setIsCreatingSequence(false);
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat ini? Status pemenang resi terkait akan di-reset.')) {
      return;
    }
    try {
      await axios.delete(`/histories/${id}`);
      fetchHistories();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menghapus riwayat');
    }
  };


  const handleSavePrize = async () => {
    if (!prizeForm.name.trim()) return alert("Nama hadiah tidak boleh kosong");
    setIsPrizesLoading(true);
    try {
      if (editPrize) {
        // Update Logic
        await axios.put(`/prizes/${editPrize.id}`, prizeForm);
        alert("Hadiah berhasil diupdate!");

      } else {
        // Logika CREATE (POST request)
        await axios.post('/prizes', prizeForm);
        alert("Hadiah berhasil ditambahkan!");
      }
      fetchPrizes();
      setEditPrize(null);
      setPrizeForm({ name: '', stock: 0 });


    } catch (err) {
      alert("Gagal menyimpan hadiah.");
      console.error(err);
    }

    setIsPrizesLoading(false);
    setIsPrizeModalOpen(false); // Add this so the modal closes if it was used
  };

  const handleDeletePrize = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus hadiah ini?')) {
      return;
    }
    setIsPrizesLoading(true);
    try {
      await axios.delete(`/prizes/${id}`);
      fetchPrizes();
      alert('Hadiah berhasil dihapus!');
    } catch (err) {
      alert('Gagal menghapus hadiah.');
      console.error(err);
    }
    setIsPrizesLoading(false);
  };






  const themeColors = {
    tiktok: 'bg-gray-50',
    shopee: 'bg-stone-50',
  };

  return (
    <div className={`min-h-screen ${themeColors[platform]} text-gray-800 transition-colors duration-500 flex flex-col font-sans`}>
      <header className={`flex flex-col md:grid md:grid-cols-3 items-center p-4 md:p-6 border-b shadow-lg gap-4 md:gap-0 ${isSuperAdmin ? 'bg-gray-900 border-gray-800 shadow-gray-900/20' : 'bg-gray-200/90 backdrop-blur-md border-gray-300 shadow-gray-300/50'}`}>
        <div className={`text-2xl md:text-3xl font-black tracking-wider flex justify-center md:justify-start w-full md:w-auto ${isSuperAdmin ? 'text-white' : 'text-gray-900'}`}>SPINWHEEL<span className="text-indigo-400">PRO</span></div>
        <div className="flex space-x-2 justify-center w-full md:w-auto">
          <button
            onClick={() => setPlatform('tiktok')}
            className={`px-5 md:px-6 py-2 rounded-full font-bold transition-all text-sm md:text-base ${platform === 'tiktok' ? 'bg-indigo-500/80 text-white shadow-lg shadow-indigo-900/30' : (isSuperAdmin ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-200 shadow-sm')}`}
          >
            TIKTOK
          </button>
          <button
            onClick={() => setPlatform('shopee')}
            className={`px-5 md:px-6 py-2 rounded-full font-bold transition-all text-sm md:text-base ${platform === 'shopee' ? 'bg-orange-500/80 text-white shadow-lg shadow-orange-900/30' : (isSuperAdmin ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-200 shadow-sm')}`}
          >
            SHOPEE
          </button>
        </div>
        <div className="hidden md:flex justify-end items-center w-full space-x-4">
          <a href="/quick-spin" className={`flex items-center text-sm font-bold transition-colors px-4 py-2 rounded-lg ${isSuperAdmin ? 'text-amber-400 hover:text-amber-300 hover:bg-gray-800' : 'text-amber-600 hover:text-amber-700 hover:bg-white shadow-sm'}`}>
            <Zap className="w-4 h-4 mr-2" /> Quick Spin
          </a>
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${isSuperAdmin ? 'bg-indigo-900/50 text-indigo-300 border-indigo-700' : 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm'}`}>
            {isSuperAdmin ? 'Super Admin' : 'Admin Toko'}
          </span>
          <button
            onClick={() => router.post('/logout')}
            className={`flex items-center text-sm font-bold transition-colors px-4 py-2 rounded-lg ${isSuperAdmin ? 'text-gray-400 hover:text-rose-400 hover:bg-gray-800' : 'text-gray-600 hover:text-rose-600 hover:bg-white shadow-sm'}`}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </header>

      {/* Live search effect */}
      {React.useMemo(() => {
        const timeout = setTimeout(() => {
          if (riggedSearchQuery.length > 3 && !selectedRiggedReceipt) {
            setIsSearchingRigged(true);
            axios.get(`/participants/search?platform=${platform}&q=${riggedSearchQuery}`)
              .then(res => setRiggedSearchResults(res.data))
              .catch(err => console.error(err))
              .finally(() => setIsSearchingRigged(false));
          } else {
            setRiggedSearchResults([]);
          }
        }, 300);
        return () => clearTimeout(timeout);
      }, [riggedSearchQuery, platform, selectedRiggedReceipt]) && null}

      {/* Live search effect for Create History */}
      {React.useMemo(() => {
        const timeout = setTimeout(() => {
          if (newHistorySearchQuery.length > 3 && !selectedNewHistoryReceipt) {
            setIsSearchingNewHistory(true);
            axios.get(`/participants/search?platform=${platform}&q=${newHistorySearchQuery}`)
              .then(res => setNewHistorySearchResults(res.data))
              .catch(err => console.error(err))
              .finally(() => setIsSearchingNewHistory(false));
          } else {
            setNewHistorySearchResults([]);
          }
        }, 300);
        return () => clearTimeout(timeout);
      }, [newHistorySearchQuery, platform, selectedNewHistoryReceipt]) && null}

      <AnimatePresence mode="wait">
        <motion.div
          key={platform}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="flex-1 flex flex-col w-full"
        >


          {/* RIGHT PANEL: DATA & HADIAH (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">


            {/* History & Queue Section (Moved into Right Panel) */}
            <div className="w-full h-[700px] flex flex-col">
              <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-300 shadow-xl flex-1 flex flex-col overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  {/* Tab Pills */}
                  <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-300 gap-4">
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      <History className="w-4 h-4 mr-2" /> Riwayat Selesai
                    </button>
                    <button
                      onClick={() => setActiveTab('event')}
                      className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'event' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                      <ListOrdered className="w-4 h-4 mr-2" /> Event
                    </button>
                    <button
                      onClick={() => setActiveTab('manage-prize')}
                      className={`flex items-center px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'manage-prize' ? 'bg-red-500/90 text-white shadow-lg' : 'text-gray-600 hover:text-gray-800'}`}>
                      <ListOrdered className="w-4 h-4 mr-2" /> Manaje Hadiah
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors shadow-lg">
                      <Upload className="w-4 h-4 mr-2" /> Upload Excel
                    </button>
                    <button onClick={() => setShowSequenceModal(true)} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors shadow-lg">
                      Untuk Content
                    </button>
                    {activeTab === 'history' && (
                      <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm">
                        + Tambah Riwayat
                      </button>
                    )}
                  </div>
                </div>

                {activeTab === 'history' ? (
                  <>
                    {/* Controls */}
                    <div className="flex flex-col gap-4 mb-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-3 text-indigo-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder="Cari Judul Acara atau No. Resi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800"
                          />
                        </div>

                        <div className="w-full md:w-48 relative">
                        <Filter className="absolute left-3 top-3 text-indigo-400 w-5 h-5" />
                        <select
                          value={filterMonth}
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800 appearance-none"
                        >
                          <option value="">Semua Bulan</option>
                          <option value="01">Januari</option>
                          <option value="02">Februari</option>
                          <option value="03">Maret</option>
                          <option value="04">April</option>
                          <option value="05">Mei</option>
                          <option value="06">Juni</option>
                          <option value="07">Juli</option>
                          <option value="08">Agustus</option>
                          <option value="09">September</option>
                          <option value="10">Oktober</option>
                          <option value="11">November</option>
                          <option value="12">Desember</option>
                        </select>
                      </div>
                      <div className="w-full md:w-64 relative">
                        <Trophy className="absolute left-3 top-3 text-indigo-400 w-5 h-5" />
                        <select
                          value={filterPrize}
                          onChange={(e) => setFilterPrize(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-800 appearance-none"
                        >
                          <option value="">Semua Hadiah</option>
                          {prizes.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {uploadedFileName && (
                      <div className="w-full flex items-center justify-center px-5 py-2.5 bg-green-50 border-2 border-green-500 rounded-xl text-sm font-semibold text-green-700 shadow-sm truncate" title={uploadedFileName}>
                        File Upload: {uploadedFileName}
                      </div>
                    )}
                  </div>

                    {/* Table */}
                    <div className="overflow-auto flex-1 custom-scrollbar rounded-xl border border-gray-300">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-200/60 text-gray-700">
                          <tr>
                            <th className="px-6 py-4 font-bold">#</th>
                            <th className="px-6 py-4 font-bold">Platform & Waktu</th>
                            <th className="px-6 py-4 font-bold">Nama Event</th>
                            <th className="px-6 py-4 font-bold">Pemenang</th>
                            <th className="px-6 py-4 font-bold text-center">Status</th>
                            <th className="px-6 py-4 font-bold text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {histories.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Belum ada riwayat undian.</td>
                            </tr>
                          ) : (
                            histories.map((h, i) => (
                              <tr key={i} className="hover:bg-gray-200/50 transition-colors">
                                <td className="px-6 py-4 text-gray-600">{new Date(h.created_at).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 text-gray-800 font-medium">{h.title}</td>
                                <td className="px-6 py-4 font-mono font-bold text-indigo-400">{h.receipt_number}</td>
                                <td className="px-6 py-4 text-gray-800">{h.prize_name}</td>
                                <td className="px-6 py-4 text-center">
                                  {isSuperAdmin && h.is_rigged ? (
                                    <span className="bg-rose-100 text-rose-700 px-4 py-1.5 rounded-full text-xs font-bold border border-rose-200 shadow-sm">Manual</span>
                                  ) : (
                                    <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200 shadow-sm">Acak</span>
                                  )}
                                </td>
                                <td className="px-6 py-6 text-center flex items-center justify-center space-x-2">
                                  <button
                                    onClick={() => handleEditHistory(h)}
                                    className="text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg border border-amber-200 transition-colors shadow-sm font-bold text-xs"
                                    title="Edit Riwayat"
                                  >
                                    Edit
                                  </button>
                                  <a href={`/replay/${h.id}`} target="_blank" rel="noreferrer" className="text-indigo-700 hover:text-indigo-800 font-bold text-xs bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg border border-indigo-200 transition-colors shadow-sm inline-block">
                                    Replay
                                  </a>
                                  <button
                                    onClick={() => handleDeleteHistory(h.id)}
                                    className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg border border-rose-200 transition-colors shadow-sm"
                                    title="Hapus Riwayat"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 px-4">
                        <button
                          onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                          disabled={historyPage === 1}
                          className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-700 font-medium"
                        >
                          <ChevronLeft className="w-5 h-5 mr-1 text-indigo-400" /> Prev
                        </button>
                        <span className="text-gray-500 font-medium">Halaman {historyPage} dari {totalPages}</span>
                        <button
                          onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                          disabled={historyPage === totalPages}
                          className="flex items-center px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-200 transition-colors disabled:opacity-50 text-gray-700 font-medium"
                        >
                          Next <ChevronRight className="w-5 h-5 ml-1 text-indigo-400" />
                        </button>
                      </div>
                    )}
                  </>
                ) : activeTab === 'event' ? (
                  /* ===================== EVENT TAB (Master-Detail) ===================== */
                  <>
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                      <div className="flex bg-gray-50 rounded-xl p-1 border border-gray-300">
                        <button onClick={() => setEventPlatform('tiktok')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${eventPlatform === 'tiktok' ? 'bg-gray-200 text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}>TikTok</button>
                        <button onClick={() => setEventPlatform('shopee')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${eventPlatform === 'shopee' ? 'bg-gray-200 text-white shadow' : 'text-gray-600 hover:text-gray-800'}`}>Shopee</button>
                      </div>
                      <div className="flex-1 flex gap-2 items-center">
                        <input type="text" value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="Nama Event Baru (Misal: Live Malam)" className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button onClick={handleCreateEvent} disabled={isCreatingEvent || !newEventName.trim()} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center transition-colors shadow-lg">
                          {isCreatingEvent ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Buat Event
                        </button>
                      </div>
                    </div>

                    <div className="overflow-auto flex-1 custom-scrollbar rounded-xl border border-gray-300">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-200/60 text-gray-700">
                          <tr>
                            <th className="px-4 py-4 font-bold text-center w-16">ID</th>
                            <th className="px-4 py-4 font-bold">Nama Event</th>
                            <th className="px-4 py-4 font-bold text-center">Slot Pending</th>
                            <th className="px-4 py-4 font-bold text-center w-32">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {events.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Belum ada event untuk {eventPlatform}.</td></tr>
                          ) : (
                            events.map((ev, idx) => (
                              <React.Fragment key={ev.id}>
                                <tr className={`hover:bg-gray-200/50 transition-colors ${expandedEventId === ev.id ? 'bg-white' : ''}`}>
                                  <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-gray-800">{ev.name}</div>
                                    <a href={`/live/${ev.platform}/${ev.slug}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-800 underline mt-1 font-mono inline-block">
                                      /live/{ev.platform}/{ev.slug}
                                    </a>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${ev.pending_count > 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white text-gray-600 border border-gray-300'}`}>{ev.pending_count} Slot</span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <div className="flex justify-center gap-2">
                                      <button onClick={() => handleToggleExpand(ev)} className={`${expandedEventId === ev.id ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'} px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors text-xs font-bold`}>
                                        {expandedEventId === ev.id ? 'Tutup Slot' : 'Atur Slot'}
                                      </button>
                                      <button onClick={() => handleDeleteEvent(ev.id)} className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg border border-rose-200 transition-colors shadow-sm" title="Hapus Event"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                  </td>
                                </tr>

                                {/* Expanded Details Row */}
                                {expandedEventId === ev.id && (
                                  <tr>
                                    <td colSpan="4" className="p-0 border-b border-gray-300">
                                      <div className="bg-gray-100 p-4 md:p-6 shadow-sm border-t border-gray-200">
                                        {isLoadingEventDetails ? (
                                          <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
                                            <div className="h-10 bg-white rounded w-1/3"></div>
                                            <div className="h-48 bg-white rounded w-full"></div>
                                          </div>
                                        ) : (
                                          <div className="max-w-4xl mx-auto">
                                            <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between items-start md:items-center">
                                              <div className="flex items-center gap-2">
                                                <label className="text-gray-600 text-sm">Tambah Slot:</label>
                                                <input type="number" min="1" max="50" value={eventSlotCount} onChange={e => setEventSlotCount(parseInt(e.target.value) || 1)} className="w-20 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 text-center text-sm" />
                                                <button onClick={handleBulkCreateEventDetails} disabled={isAddingEvents} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center transition-colors">
                                                  {isAddingEvents ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />} Tambah
                                                </button>
                                              </div>
                                              <div className="flex gap-2 items-center">
                                                <a href={`/live/${ev.platform}/${ev.slug}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-center inline-flex items-center group">
                                                  <span className="relative flex h-2 w-2 mr-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                                  </span>
                                                  Buka Tampilan Spin <span className="ml-1 group-hover:translate-x-0.5 transition-transform">↗</span>
                                                </a>
                                                <a href={`/toko?platform=${ev.platform}&slug=${ev.slug}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors text-center inline-flex items-center">
                                                  Buka Admin Toko ↗
                                                </a>
                                              </div>
                                            </div>

                                            <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-lg">
                                              <table className="w-full text-left text-xs md:text-sm">
                                                <thead className="bg-gray-100 text-gray-700">
                                                  <tr>
                                                    <th className="px-3 py-3 font-bold text-center w-12">#</th>
                                                    <th className="px-3 py-3 font-bold">Hadiah</th>
                                                    <th className="px-3 py-3 font-bold">Resi (Fix)</th>
                                                    <th className="px-3 py-3 font-bold text-center">Status</th>
                                                    <th className="px-3 py-3 font-bold text-center w-12">Aksi</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 bg-white">
                                                  {eventDetails.length === 0 ? (
                                                    <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">Belum ada slot untuk event ini.</td></tr>
                                                  ) : (
                                                    eventDetails.map((detail, i) => (
                                                      <tr key={detail.id} className="hover:bg-white/70 transition-colors">
                                                        <td className="px-3 py-2 text-center"><span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-[10px] font-bold">#{i + 1}</span></td>
                                                        <td className="px-3 py-2">
                                                          {detail.status === 'completed' ? (
                                                            <span className="text-gray-600 font-bold">{detail.prize?.name || '-'}</span>
                                                          ) : (
                                                            <select value={detail.prize_id || ''} onChange={e => handleUpdateEventDetail(detail.id, 'prize_id', e.target.value)} className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-xs outline-none focus:ring-1 focus:ring-emerald-500">
                                                              <option value="">-- Acak Hadiah --</option>
                                                              {prizes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                            </select>
                                                          )}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                          {detail.status === 'completed' ? (
                                                            <span className="font-mono text-xs font-bold text-gray-600">{detail.participant?.receipt_number || '-'}</span>
                                                          ) : (
                                                            <div className="relative">
                                                              {detail.participant ? (
                                                                <div className="flex items-center gap-1.5 bg-indigo-900/20 px-2 py-1 rounded border border-indigo-500/30">
                                                                  <span className="font-mono text-xs font-bold text-indigo-400">{detail.participant.receipt_number}</span>
                                                                  <button onClick={() => handleUpdateEventDetail(detail.id, 'participant_id', null)} className="text-rose-400 hover:text-rose-300 ml-auto" title="Hapus"><Trash2 className="w-3 h-3" /></button>
                                                                </div>
                                                              ) : (
                                                                <>
                                                                  <input type="text" placeholder="Cari Resi..." value={participantSearch[detail.id] || ''} onChange={e => searchParticipantsForEvent(detail.id, e.target.value)} className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                                                                  {participantResults[detail.id]?.length > 0 && (
                                                                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-400 rounded shadow-xl max-h-32 overflow-y-auto">
                                                                      {participantResults[detail.id].map(p => (
                                                                        <button key={p.id} onClick={() => { handleUpdateEventDetail(detail.id, 'participant_id', p.id); setParticipantSearch(prev => ({ ...prev, [detail.id]: '' })); setParticipantResults(prev => ({ ...prev, [detail.id]: [] })); }} className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-200 text-gray-700 font-mono">{p.receipt_number}</button>
                                                                      ))}
                                                                    </div>
                                                                  )}
                                                                </>
                                                              )}
                                                            </div>
                                                          )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                          {detail.status === 'completed' ? (
                                                            <span className="text-emerald-400 text-[10px] font-bold">Selesai</span>
                                                          ) : detail.participant_id ? (
                                                            <span className="text-fuchsia-400 text-[10px] font-bold">Fix</span>
                                                          ) : detail.prize_id ? (
                                                            <span className="text-amber-400 text-[10px] font-bold">Set</span>
                                                          ) : (
                                                            <span className="text-gray-500 text-[10px] font-bold">Kosong</span>
                                                          )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                          {detail.status === 'pending' && (
                                                            <button onClick={() => handleDeleteEventDetail(detail.id)} className="text-rose-500 hover:text-rose-400 p-1 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                          )}
                                                        </td>
                                                      </tr>
                                                    ))
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : activeTab === 'manage-prize' ? (
                  /* ===================== MANAGE PRIZE TAB ===================== */
                  <div className="flex flex-col h-full rounded-xl p-2">
                    <div className="flex justify-between items-center mb-6 px-2">
                      <h2 className="text-xl font-bold text-gray-800">Daftar Hadiah</h2>
                      <button onClick={() => { setEditPrize(null); setPrizeForm({ name: '', stock: 0 }); setIsPrizeModalOpen(true); }} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-colors text-sm flex items-center">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Hadiah
                      </button>
                    </div>

                    <div className="overflow-auto flex-1 custom-scrollbar rounded-xl border border-gray-300 bg-white">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-200/60 text-gray-700">
                          <tr>
                            <th className="px-4 py-4 font-bold text-center w-16">ID</th>
                            <th className="px-4 py-4 font-bold">Nama Hadiah</th>
                            <th className="px-4 py-4 font-bold text-center">Stok</th>
                            <th className="px-4 py-4 font-bold text-center w-32">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {prizes.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Belum ada hadiah.</td></tr>
                          ) : (
                            prizes.map((p, idx) => (
                              <tr key={p.id} className="hover:bg-gray-200/50 transition-colors">
                                <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                <td className="px-4 py-3 font-bold text-gray-800">{p.name}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                                    {p.stock}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center space-x-2 flex justify-center">
                                  <button onClick={() => { setEditPrize(p); setIsPrizeModalOpen(true); }} className="text-amber-600 hover:text-amber-700 p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors">Edit</button>
                                  <button onClick={() => handleDeletePrize(p.id)} className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

              </div>
            </div>
          </div>


        </motion.div>
      </AnimatePresence>

      {/* Prize Modal */}
      <AnimatePresence>
        {isPrizeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="bg-white p-6 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">{editPrize ? 'Edit Hadiah' : 'Tambah Hadiah'}</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nama Hadiah</label>
                  <input
                    type="text"
                    value={prizeForm.name}
                    onChange={e => setPrizeForm({ ...prizeForm, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Contoh: Sepatu Sneakers"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Stok (Opsional)</label>
                  <input
                    type="number"
                    value={prizeForm.stock}
                    onChange={e => setPrizeForm({ ...prizeForm, stock: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Biarkan 0 jika tidak terbatas"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button onClick={() => { setIsPrizeModalOpen(false); setEditPrize(null); setPrizeForm({ name: '', stock: 0 }); }} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-bold text-sm">Batal</button>
                  <button onClick={handleSavePrize} disabled={isPrizesLoading} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors font-bold flex items-center text-sm disabled:opacity-50">
                    {isPrizesLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create History Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="bg-white p-6 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Tambah Riwayat SpinWheel</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Judul Acara</label>
                  <input type="text" value={newHistoryTitle} onChange={e => setNewHistoryTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: Undian Juli 2026" />
                </div>

                <div className="relative">
                  <label className="block text-sm text-gray-600 mb-1">Pilih Pemenang (No. Resi)</label>
                  {selectedNewHistoryReceipt ? (
                    <div className="flex justify-between items-center bg-indigo-900/30 border border-indigo-500/50 p-2 rounded-xl text-indigo-400">
                      <span className="font-mono">{selectedNewHistoryReceipt}</span>
                      <button onClick={() => { setSelectedNewHistoryReceipt(''); setNewHistorySearchQuery(''); }} className="text-indigo-400 font-bold text-xl leading-none">&times;</button>
                    </div>
                  ) : (
                    <>
                      <input type="text" value={newHistorySearchQuery} onChange={e => setNewHistorySearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ketik min 4 huruf..." />
                      {isSearchingNewHistory && <Loader2 className="absolute right-3 top-8 animate-spin text-gray-500 w-5 h-5" />}
                      {newHistorySearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl max-h-40 overflow-y-auto shadow-xl">
                          {newHistorySearchResults.map(p => (
                            <div key={p.id} onClick={() => { setSelectedNewHistoryReceipt(p.receipt_number); setNewHistorySearchResults([]); }} className="p-3 hover:bg-gray-200 cursor-pointer font-mono">{p.receipt_number}</div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pilih Hadiah</label>
                  <select value={newHistoryPrize} onChange={e => setNewHistoryPrize(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">-- Pilih Hadiah --</option>
                    {prizes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-3 bg-fuchsia-900/20 p-3 rounded-xl border border-fuchsia-500/30">
                    <input
                      type="checkbox"
                      id="create_is_rigged"
                      checked={newHistoryIsRigged}
                      onChange={(e) => setNewHistoryIsRigged(e.target.checked)}
                      className="w-5 h-5 text-fuchsia-500 bg-gray-50 border-gray-400 rounded focus:ring-fuchsia-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="create_is_rigged" className="text-sm font-bold text-fuchsia-300 select-none cursor-pointer">
                      Tandai sebagai "Settingan" (Rigged)
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-bold">Batal</button>
                <button onClick={handleCreateHistory} disabled={isCreatingHistory} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-bold flex items-center text-sm disabled:opacity-50">
                  {isCreatingHistory && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Simpan
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit History Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="bg-white p-6 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Edit Riwayat SpinWheel</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Judul Acara</label>
                  <input type="text" value={newHistoryTitle} onChange={e => setNewHistoryTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Resi Pemenang</label>
                  <input type="text" value={editingHistory?.receipt_number || ''} disabled className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-500 cursor-not-allowed opacity-70" />
                  <p className="text-xs text-gray-500 mt-1">Resi pemenang tidak dapat diubah.</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Hadiah</label>
                  <select value={newHistoryPrize} onChange={e => setNewHistoryPrize(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="" disabled>-- Pilih Hadiah --</option>
                    {prizes.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {isSuperAdmin && (
                  <div className="flex items-center gap-3 bg-fuchsia-900/20 p-3 rounded-xl border border-fuchsia-500/30">
                    <input
                      type="checkbox"
                      id="edit_is_rigged"
                      checked={newHistoryIsRigged}
                      onChange={(e) => setNewHistoryIsRigged(e.target.checked)}
                      className="w-5 h-5 text-fuchsia-500 bg-gray-50 border-gray-400 rounded focus:ring-fuchsia-500 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="edit_is_rigged" className="text-sm font-bold text-fuchsia-300 select-none cursor-pointer">
                      Tandai sebagai "Settingan" (Rigged)
                    </label>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { setShowEditModal(false); setEditingHistory(null); }} className="flex-1 bg-gray-200 hover:bg-gray-600 text-white py-2.5 rounded-xl font-bold transition-colors text-sm">Batal</button>
                  <button onClick={handleUpdateHistory} disabled={isCreatingHistory} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold transition-colors flex items-center justify-center shadow-lg disabled:opacity-50 text-sm">
                    {isCreatingHistory ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sequence Builder Modal */}
      <AnimatePresence>
        {showSequenceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          >
            <div className="bg-white p-6 rounded-2xl w-full max-w-3xl border border-gray-300 shadow-2xl my-8">
              <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center justify-between">
                Buat Sesi Konten Spin
                <button onClick={() => setShowSequenceModal(false)} className="text-gray-600 hover:text-white">&times;</button>
              </h3>

              {createdSequenceUrl ? (
                <div className="bg-emerald-900/40 border border-emerald-800 p-6 rounded-xl text-center space-y-4">
                  <h4 className="text-emerald-400 font-bold text-lg">Sesi Konten Berhasil Dibuat!</h4>
                  <p className="text-gray-700 text-sm">Bagikan link ini ke tim konten untuk memulai perekaman SpinWheel secara berurutan:</p>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-300 flex items-center justify-between overflow-hidden">
                    <code className="text-emerald-300 text-sm break-all">{createdSequenceUrl}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(createdSequenceUrl);
                        alert('Link berhasil disalin!');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm ml-4 font-bold shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <button onClick={() => { setShowSequenceModal(false); setCreatedSequenceUrl(''); setSequenceItems([]); setSequenceTitle(''); }} className="mt-4 bg-gray-200 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold w-full transition-colors">Tutup</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Judul Sesi Konten</label>
                    <input type="text" value={sequenceTitle} onChange={e => setSequenceTitle(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-fuchsia-500 outline-none" placeholder="Contoh: Video TikTok 15 Juli" />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Urutan Putaran ({sequenceItems.length} putaran)</label>
                    <div className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                      {sequenceItems.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm">
                          Belum ada urutan putaran ditambahkan.<br />Silakan tambah menggunakan tombol di bawah.
                        </div>
                      ) : sequenceItems.map((item, index) => (
                        <div key={item.id} className="bg-gray-50 border border-gray-300 p-4 rounded-xl relative group flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <span className="bg-fuchsia-900/50 text-fuchsia-400 text-xs font-bold px-2 py-1 rounded-lg border border-fuchsia-800">
                              Putaran ke-{index + 1}: {item.type === 'existing_history' ? 'Replay Riwayat' : item.type === 'new_rigged' ? 'Pemenang Baru (Setting)' : 'Putaran Acak'}
                            </span>
                            <button onClick={() => handleRemoveSequenceItem(item.id)} className="text-gray-500 hover:text-rose-400 transition-colors">&times;</button>
                          </div>

                          {item.type === 'existing_history' && (
                            <div className="flex gap-2">
                              <select
                                value={item.history_id}
                                onChange={e => handleUpdateSequenceItem(item.id, 'history_id', e.target.value)}
                                className="w-full bg-white border border-gray-400 rounded-lg px-3 py-2 text-gray-800 text-sm outline-none"
                              >
                                <option value="">-- Pilih Riwayat --</option>
                                {histories
                                  .filter(h => h.id.toString() === item.history_id || !sequenceItems.some(seq => seq.history_id === h.id.toString()))
                                  .map(h => (
                                    <option key={h.id} value={h.id}>{h.receipt_number} - {h.prize_name}</option>
                                  ))}
                              </select>
                            </div>
                          )}

                          {item.type === 'new_rigged' && (
                            <div className="flex flex-col md:flex-row gap-3">
                              <input
                                type="text"
                                placeholder="Resi Pemenang"
                                value={item.receipt_number}
                                onChange={e => handleUpdateSequenceItem(item.id, 'receipt_number', e.target.value)}
                                className="flex-1 bg-white border border-gray-400 rounded-lg px-3 py-2 text-gray-800 text-sm outline-none"
                              />
                              <select
                                value={item.prize_id}
                                onChange={e => handleUpdateSequenceItem(item.id, 'prize_id', e.target.value)}
                                className="flex-1 bg-white border border-gray-400 rounded-lg px-3 py-2 text-gray-800 text-sm outline-none"
                              >
                                <option value="">-- Pilih Hadiah --</option>
                                {prizes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                            </div>
                          )}

                          {item.type === 'random' && (
                            <p className="text-xs text-gray-500 italic">Sistem akan mengacak pemenang secara random dari sisa peserta saat sesi dimainkan.</p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center border-t border-gray-300 pt-4">
                      <button onClick={() => handleAddSequenceItem('existing_history')} className="px-3 py-1.5 bg-white border border-gray-400 hover:border-gray-500 text-gray-700 rounded-lg text-xs font-bold transition-colors">
                        + Tambah Replay Riwayat
                      </button>
                      {isSuperAdmin && (
                        <button onClick={() => handleAddSequenceItem('new_rigged')} className="px-3 py-1.5 bg-white border border-gray-400 hover:border-fuchsia-500/50 text-fuchsia-300 rounded-lg text-xs font-bold transition-colors">
                          + Tambah Pemenang Baru (Setting)
                        </button>
                      )}
                      <button onClick={() => handleAddSequenceItem('random')} className="px-3 py-1.5 bg-white border border-gray-400 hover:border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-bold transition-colors">
                        + Tambah Putaran Acak
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-gray-300 pt-4 mt-6">
                    <button onClick={() => setShowSequenceModal(false)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-600 text-white rounded-xl transition-colors font-bold text-sm">Batal</button>
                    <button onClick={handleCreateSequence} disabled={isCreatingSequence} className="px-5 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl transition-colors font-bold flex items-center text-sm disabled:opacity-50 shadow-lg shadow-fuchsia-900/50">
                      {isCreatingSequence ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Generate Link Konten'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Excel Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="bg-white p-6 rounded-2xl w-full max-w-md border border-gray-300 shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                <Upload className="w-5 h-5 mr-2" /> Upload Data Excel
              </h3>
              
              <form onSubmit={handleUploadData} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pilih File (.xlsx, .csv)</label>
                  <input
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={e => setUploadFile(e.target.files[0])}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                
                <div className="pt-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hapus data lama?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        value="yes" 
                        checked={uploadClearOld === 'yes'} 
                        onChange={e => setUploadClearOld(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Yes (Timpa/Reset Data)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="radio" 
                        value="no" 
                        checked={uploadClearOld === 'no'} 
                        onChange={e => setUploadClearOld(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                      />
                      <span className="text-sm font-medium text-gray-700">No (Tambah Data Saja)</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 italic">*Foreign key (Histori & Event Detail) aman karena constraint di database menggunakan onDelete('set null').</p>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <button type="button" onClick={() => { setShowUploadModal(false); setUploadFile(null); }} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-colors font-bold text-sm">Batal</button>
                  <button type="submit" disabled={isUploading} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-bold flex items-center text-sm disabled:opacity-50">
                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />} 
                    {isUploading ? 'Mengupload...' : 'Upload Data'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
