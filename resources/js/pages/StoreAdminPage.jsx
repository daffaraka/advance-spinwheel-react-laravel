import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Loader2, Plus, Trash2, LogOut, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { router } from '@inertiajs/react';

const LiveSearchReceipt = ({ detail, platform, onSelect }) => {
  const [query, setQuery] = useState(detail.participant?.receipt_number || '');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (detail.participant) {
      setQuery(detail.participant.receipt_number);
    } else {
      setQuery('');
    }
  }, [detail.participant]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length >= 4 && showDropdown) {
        setIsSearching(true);
        axios.get(`/participants/search?platform=${platform}&q=${query}`)
          .then(res => {
            setResults(res.data);
            setIsSearching(false);
          })
          .catch(err => {
            console.error(err);
            setIsSearching(false);
          });
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [query, platform, showDropdown]);

  return (
    <div className="relative">
      <input 
        type="text" 
        value={query}
        onChange={e => {
          setQuery(e.target.value);
          setShowDropdown(true);
          if (e.target.value === '') {
            onSelect(null);
          }
        }}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder="Cari Resi (Min 4 Karakter)" 
        className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 text-gray-800 text-xs font-mono outline-none focus:ring-1 focus:ring-emerald-500" 
      />
      {showDropdown && query.length >= 4 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
          {isSearching ? (
            <div className="px-3 py-2 text-xs text-gray-500">Mencari...</div>
          ) : results.length > 0 ? (
            results.map(r => (
              <div 
                key={r.id} 
                className="px-3 py-2 text-xs font-mono hover:bg-emerald-50 cursor-pointer text-gray-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(r.receipt_number);
                  setShowDropdown(false);
                  onSelect(r.id);
                }}
              >
                {r.receipt_number}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-gray-500">Tidak ditemukan</div>
          )}
        </div>
      )}
    </div>
  );
};

export default function StoreAdminPage() {
  const [eventPlatform, setEventPlatform] = useState('tiktok');
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  
  // Event States
  const [events, setEvents] = useState([]);
  const [prizes, setPrizes] = useState([]);
  const [newEventName, setNewEventName] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState(null);
  
  // Event Details States
  const [eventDetails, setEventDetails] = useState([]);
  const [eventSlotCount, setEventSlotCount] = useState(1);
  const [isAddingEvents, setIsAddingEvents] = useState(false);
  const [isLoadingEventDetails, setIsLoadingEventDetails] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchPrizes();
  }, [eventPlatform]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`/events?platform=${eventPlatform}`);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrizes = async () => {
    try {
      const res = await axios.get('/prizes');
      setPrizes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return;
    setIsCreatingEvent(true);
    try {
      await axios.post('/events', { name: newEventName, platform: eventPlatform });
      setNewEventName('');
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal membuat event');
    }
    setIsCreatingEvent(false);
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Yakin ingin menghapus event ini? Semua detail event juga akan terhapus.')) return;
    try {
      await axios.delete(`/events/${id}`);
      if (expandedEventId === id) setExpandedEventId(null);
      fetchEvents();
    } catch (err) {
      alert('Gagal menghapus event');
    }
  };

  const handleToggleExpand = async (ev) => {
    if (expandedEventId === ev.id) {
      setExpandedEventId(null);
      setEventDetails([]);
    } else {
      setExpandedEventId(ev.id);
      setIsLoadingEventDetails(true);
      try {
        const res = await axios.get(`/events/${ev.id}/details`);
        setEventDetails(res.data);
      } catch (err) {
        console.error(err);
      }
      setIsLoadingEventDetails(false);
    }
  };

  const handleBulkCreateEventDetails = async () => {
    if (eventSlotCount < 1) return;
    setIsAddingEvents(true);
    try {
      await axios.post(`/events/${expandedEventId}/details/bulk`, { count: eventSlotCount });
      const res = await axios.get(`/events/${expandedEventId}/details`);
      setEventDetails(res.data);
      setEventSlotCount(1);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal menambahkan slot');
    }
    setIsAddingEvents(false);
  };

  const handleUpdateEventDetail = async (id, field, value) => {
    try {
      await axios.put(`/event-details/${id}`, { [field]: value });
      const res = await axios.get(`/events/${expandedEventId}/details`);
      setEventDetails(res.data);
      fetchEvents();
    } catch (err) {
      alert('Gagal mengupdate slot');
    }
  };

  const handleDeleteEventDetail = async (id) => {
    if (!window.confirm('Hapus slot ini?')) return;
    try {
      await axios.delete(`/event-details/${id}`);
      const res = await axios.get(`/events/${expandedEventId}/details`);
      setEventDetails(res.data);
      fetchEvents();
    } catch (err) {
      alert('Gagal menghapus slot');
    }
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
        // Refresh things if needed
      } catch (err) {
        alert('Upload gagal!');
      }
      setIsUploading(false);
    };
    fileInput.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <header className="flex flex-col md:flex-row justify-between items-center p-4 md:p-6 bg-gray-200/90 backdrop-blur-md shadow-lg border-b border-gray-300 shadow-gray-300/50">
        <div className="text-2xl font-black tracking-wider text-gray-900 mb-4 md:mb-0">
          SPINWHEEL<span className="text-indigo-600">TOKO</span>
        </div>
        <div className="flex items-center space-x-4">
          <a href="/quick-spin" className="flex items-center text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors px-4 py-2 rounded-lg hover:bg-white shadow-sm">
            <Zap className="w-4 h-4 mr-2" /> Quick Spin
          </a>
          <span className="px-3 py-1 text-xs font-bold rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm">
            Admin Toko
          </span>
          <button 
            onClick={() => router.post('/logout')}
            className="flex items-center text-sm font-bold text-gray-600 hover:text-rose-600 transition-colors px-4 py-2 rounded-lg hover:bg-white shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-8 flex flex-col gap-8">
        
        {/* Upload Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-indigo-500" /> Upload Excel Partisipan (Opsional)
          </h2>
          <p className="text-gray-500 text-sm mb-6">Upload data partisipan dari Excel sebelum membuat/memulai putaran Event.</p>
          
          <div className="flex flex-col md:flex-row gap-4"> 
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors flex items-center justify-center min-w-[200px]"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
              {isUploading ? 'Mengunggah...' : 'Upload Excel'}
            </button>
          </div>
        </section>

        {/* Event Management Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 flex-1">
          <h2 className="text-xl font-bold mb-6 text-gray-900">Manajemen Event</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex gap-2">
              <button onClick={() => setEventPlatform('mix')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all border ${eventPlatform === 'mix' ? 'bg-gray-900 text-white border-gray-900 shadow' : 'text-gray-600 hover:text-gray-800 bg-gray-200/50 border-transparent'}`}>Mix</button>
              <button onClick={() => setEventPlatform('tiktok')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all border ${eventPlatform === 'tiktok' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'text-gray-600 hover:text-gray-800 bg-gray-200/50 border-gray-300'}`}>TikTok</button>
              <button onClick={() => setEventPlatform('shopee')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all border ${eventPlatform === 'shopee' ? 'bg-orange-500 text-white border-orange-500 shadow' : 'text-gray-600 hover:text-gray-800 bg-gray-200/50 border-gray-300'}`}>Shopee</button>
            </div>
            <div className="flex-1 flex gap-2 items-center">
              <input type="text" value={newEventName} onChange={e => setNewEventName(e.target.value)} placeholder="Nama Event Baru (Misal: Live Promo)" className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={handleCreateEvent} disabled={isCreatingEvent || !newEventName.trim()} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center transition-colors shadow-sm">
                {isCreatingEvent ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Buat
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-300">
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
                  events.map(ev => (
                    <React.Fragment key={ev.id}>
                      <tr className={`hover:bg-gray-100 transition-colors ${expandedEventId === ev.id ? 'bg-gray-50' : ''}`}>
                        <td className="px-4 py-3 text-center text-gray-500">#{ev.id}</td>
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
                            <button onClick={() => handleToggleExpand(ev)} className={`${expandedEventId === ev.id ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'} px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors text-xs font-bold flex items-center`}>
                              {expandedEventId === ev.id ? <><ChevronUp className="w-3 h-3 mr-1"/>Tutup</> : <><ChevronDown className="w-3 h-3 mr-1"/>Atur</>}
                            </button>
                            <button onClick={() => handleDeleteEvent(ev.id)} className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg border border-rose-200 transition-colors shadow-sm" title="Hapus Event"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                      
                      {expandedEventId === ev.id && (
                        <tr>
                          <td colSpan="4" className="p-0 border-b border-gray-300">
                            <div className="bg-gray-50 p-4 md:p-6 shadow-inner border-t border-gray-200">
                              {isLoadingEventDetails ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>
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

                                  <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-md bg-white min-h-[300px]">
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
                                      <tbody className="divide-y divide-gray-200">
                                        {eventDetails.length === 0 ? (
                                          <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">Belum ada slot untuk event ini.</td></tr>
                                        ) : (
                                          eventDetails.map((detail, i) => (
                                            <tr key={detail.id} className="hover:bg-gray-50 transition-colors">
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
                                                  <LiveSearchReceipt 
                                                    detail={detail} 
                                                    platform={ev.platform}
                                                    onSelect={(participantId) => handleUpdateEventDetail(detail.id, 'participant_id', participantId)}
                                                  />
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-center">
                                                {detail.status === 'completed' ? (
                                                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200 shadow-sm">Selesai</span>
                                                ) : (
                                                  <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold border border-amber-200 shadow-sm">Pending</span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 text-center">
                                                <button onClick={() => handleDeleteEventDetail(detail.id)} className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-1 rounded border border-rose-200 transition-colors shadow-sm"><Trash2 className="w-3 h-3" /></button>
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
        </section>

      </main>
    </div>
  );
}
