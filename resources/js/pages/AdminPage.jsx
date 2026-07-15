import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, PlusCircle, CheckCircle, Save, Upload, Loader2, LogOut } from 'lucide-react';
import { router } from '@inertiajs/react';

export default function AdminPage() {
  const [prizes, setPrizes] = useState([]);

  const [newPrize, setNewPrize] = useState({ name: '', stock: '' });
  const [editingPrize, setEditingPrize] = useState(null);
  const [rigging, setRigging] = useState({ platform: 'tiktok', prize_id: '', receipt_number: '' });

  // Combined upload states
  const [combinedFile, setCombinedFile] = useState(null);
  const [isUploadingCombined, setIsUploadingCombined] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      const res = await axios.get('/prizes');
      setPrizes(res.data);
      if (res.data.length > 0) {
        setRigging(prev => ({ ...prev, prize_id: res.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPrize = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/prizes', newPrize);
      alert('Hadiah berhasil ditambahkan!');
      setNewPrize({ name: '', stock: '' });
      fetchPrizes();
    } catch (err) {
      alert('Gagal menambah hadiah.');
    }
  };

  const handleUpdatePrize = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/prizes/${editingPrize.id}`, editingPrize);
      alert('Hadiah berhasil diupdate!');
      setEditingPrize(null);
      fetchPrizes();
    } catch (err) {
      alert('Gagal mengupdate hadiah.');
    }
  };

  const handleDeletePrize = async (id) => {
    if (!window.confirm('Yakin ingin menghapus hadiah ini?')) return;
    try {
      await axios.delete(`/prizes/${id}`);
      fetchPrizes();
    } catch (err) {
      alert('Gagal menghapus hadiah.');
    }
  };

  const handleSetWinner = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/settings/winner', rigging);
      alert('Pemenang pengaturan (Rigging) berhasil disimpan!');
      setRigging(prev => ({ ...prev, receipt_number: '' }));
    } catch (err) {
      alert('Gagal menyimpan pemenang.');
    }
  };

  const handleCombinedUpload = async () => {
    if (!combinedFile) return alert('Pilih file terlebih dahulu.');
    setIsUploadingCombined(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', combinedFile);
      const res = await axios.post('/upload-combined', formData);
      setUploadResult(res.data);
      setCombinedFile(null);
      const fileInput = document.getElementById('combined-file-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      alert('Gagal mengupload file. Pastikan format file benar (xlsx/csv).');
    } finally {
      setIsUploadingCombined(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
          <div className="flex items-center">
            <Settings className="w-8 h-8 mr-3 text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-100">Admin Panel - Spinwheel Settings</h1>
          </div>
          <button
            onClick={() => router.post('/logout')}
            className="flex items-center text-sm font-bold text-gray-400 hover:text-rose-400 transition-colors px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>

        {/* Combined Upload Section */}
        <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center text-gray-100">
            <Upload className="mr-2 text-indigo-400" /> Import Data Peserta (Gabungan)
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Upload file Excel (.xlsx) dengan 2 kolom: <strong className="text-gray-300">Resi</strong> dan <strong className="text-gray-300">Platform</strong> (Tiktok / Shopee). Data lama akan ditimpa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                id="combined-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setCombinedFile(e.target.files[0])}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 file:cursor-pointer file:transition-colors bg-gray-900 border border-gray-700 rounded-lg p-2"
              />
            </div>
            <button
              onClick={handleCombinedUpload}
              disabled={isUploadingCombined || !combinedFile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center px-6 py-2.5 rounded-lg font-bold transition-colors shadow-lg disabled:opacity-50 whitespace-nowrap"
            >
              {isUploadingCombined ? <Loader2 className="animate-spin mr-2 w-5 h-5" /> : <Upload className="mr-2 w-5 h-5 text-indigo-200" />}
              {isUploadingCombined ? 'Mengimport...' : 'Import Data'}
            </button>
          </div>
          {uploadResult && (
            <div className="mt-4 p-4 bg-emerald-900/30 border border-emerald-800 rounded-xl text-sm">
              <p className="text-emerald-400 font-bold mb-2">✓ Import Berhasil!</p>
              {uploadResult.filename && (
                <p className="text-emerald-300 font-medium mb-2 truncate">File: {uploadResult.filename}</p>
              )}
              <div className="flex gap-6 text-gray-300">
                <span>TikTok: <strong className="text-indigo-400">{uploadResult.tiktok}</strong> resi</span>
                <span>Shopee: <strong className="text-indigo-400">{uploadResult.shopee}</strong> resi</span>
                <span>Total: <strong className="text-indigo-400">{uploadResult.total}</strong> resi</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Add Prize Form */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-100">
              <PlusCircle className="mr-2 text-indigo-400" /> Tambah Hadiah Baru
            </h2>
            {editingPrize ? (
              <form onSubmit={handleUpdatePrize} className="space-y-4 mb-6 p-4 bg-indigo-900/30 border border-indigo-500/50 rounded-xl">
                <h3 className="font-bold text-indigo-400">Edit Hadiah</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nama Hadiah</label>
                  <input
                    type="text"
                    value={editingPrize.name}
                    onChange={(e) => setEditingPrize({ ...editingPrize, name: e.target.value })}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Stok</label>
                  <input
                    type="number"
                    value={editingPrize.stock}
                    onChange={(e) => setEditingPrize({ ...editingPrize, stock: e.target.value })}
                    required
                    min="0"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingPrize(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-bold transition-colors">
                    Batal
                  </button>
                  <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg font-bold transition-colors">
                    Update
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddPrize} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nama Hadiah</label>
                  <input
                    type="text"
                    value={newPrize.name}
                    onChange={(e) => setNewPrize({ ...newPrize, name: e.target.value })}
                    required
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-200"
                    placeholder="Misal: iPhone 15 Pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Stok</label>
                  <input
                    type="number"
                    value={newPrize.stock}
                    onChange={(e) => setNewPrize({ ...newPrize, stock: e.target.value })}
                    required
                    min="1"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-200"
                  />
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center transition-colors shadow-lg">
                  <Save className="mr-2 w-5 h-5 text-indigo-200" /> Simpan Hadiah
                </button>
              </form>
            )}

            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-400 mb-2 border-b border-gray-700 pb-2">Daftar Hadiah Tersedia:</h3>
              <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                {prizes.map(p => (
                  <li key={p.id} className="flex justify-between items-center bg-gray-900 border border-gray-700 p-3 rounded-xl text-sm transition-all hover:border-gray-600">
                    <div>
                      <span className="font-semibold text-gray-200 block">{p.name}</span>
                      <span className="text-indigo-400 bg-gray-800 px-2 py-0.5 rounded font-mono text-xs font-bold border border-gray-700 mt-1 inline-block">Stok: {p.stock}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingPrize(p)} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold bg-indigo-900/30 px-3 py-1.5 rounded-lg border border-indigo-500/30">Edit</button>
                      <button onClick={() => handleDeletePrize(p.id)} className="text-rose-400 hover:text-rose-300 text-xs font-bold bg-rose-900/30 px-3 py-1.5 rounded-lg border border-rose-500/30">Hapus</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Setup Rigged Winner */}
          <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center text-gray-100">
              <CheckCircle className="mr-2 text-indigo-400" /> Pengaturan Pemenang (Rigging)
            </h2>
            <form onSubmit={handleSetWinner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Platform</label>
                <select
                  value={rigging.platform}
                  onChange={(e) => setRigging({ ...rigging, platform: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-200"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="shopee">Shopee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Pilih Hadiah</label>
                <select
                  value={rigging.prize_id}
                  onChange={(e) => setRigging({ ...rigging, prize_id: e.target.value })}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-200"
                >
                  <option value="" disabled>-- Pilih Hadiah --</option>
                  {prizes.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nomor Resi Pemenang</label>
                <input
                  type="text"
                  value={rigging.receipt_number}
                  onChange={(e) => setRigging({ ...rigging, receipt_number: e.target.value })}
                  required
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-gray-200"
                  placeholder="Masukkan nomor resi target..."
                />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold flex items-center justify-center transition-colors shadow-lg">
                <Save className="mr-2 w-5 h-5 text-indigo-200" /> Daftarkan Pemenang
              </button>
            </form>
            <p className="mt-4 text-xs text-gray-500 italic">
              * Resi yang didaftarkan akan otomatis keluar sebagai pemenang pada spin berikutnya di platform dan hadiah yang sesuai.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
