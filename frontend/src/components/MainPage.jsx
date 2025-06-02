import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds) || !isFinite(timeInSeconds) || timeInSeconds < 0) {
    return '00:00';
  }
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

function MainPage({ onLogout }) {
  const fetchWithAuth = async (url, options = {}, onLogoutCallback) => {
    const token = localStorage.getItem('authToken');
    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Jika ada body dan Content-Type belum diset, dan body adalah objek, set ke application/json
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        // Biasanya jika body adalah stringified JSON, Content-Type sudah diset oleh pemanggil
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      console.error("MainPage: Unauthorized (401) - Mungkin token sudah kadaluarsa.");
      if (onLogoutCallback) {
        onLogoutCallback();
      }
      throw new Error('Unauthorized - Silakan login kembali.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Gagal fetch data! Status: ${response.status}` }));
      throw new Error(errorData.message || errorData.error || `Gagal fetch data! Status: ${response.status}`);
    }

    if (response.status === 204) { // No Content
      return null; // Atau { success: true } atau objek pesan sukses kustom
    }
    return response.json(); // Untuk 200, 201, dll.
  };

  const [playlists, setPlaylists] = useState([]);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [error, setError] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [jamendoResults, setJamendoResults] = useState([]);
  const [loadingJamendo, setLoadingJamendo] = useState(false);
  const [jamendoError, setJamendoError] = useState(null);

  const searchOnJamendo = async () => {
    if (!searchTerm.trim()) {
      setJamendoResults([]);
      return;
    }
    const currentSearchTerm = searchTerm.trim();
    console.log(`MainPage: Searching Jamendo for: "${currentSearchTerm}"`);
    setLoadingJamendo(true);
    setJamendoResults([]);
    setJamendoError(null);

    // --- GANTI {YOUR_CLIENT_ID} DENGAN CLIENT_ID ASLI ABANG ---
    const YOUR_JAMENDO_CLIENT_ID = 'c1150464'; 
    // ---------------------------------------------------------

    if (YOUR_JAMENDO_CLIENT_ID === 'CLIENT_ID_GUA') {
      console.error("JAMENDO CLIENT ID belum diisi!");
      setJamendoError("Client ID Jamendo belum dikonfigurasi.");
      setLoadingJamendo(false);
      return;
    }

    try {
      // Menggunakan parameter 'namesearch' untuk mencari di judul lagu, album, dan artis
      const searchUrl = `https://api.jamendo.com/v3.0/tracks/?client_id=${YOUR_JAMENDO_CLIENT_ID}&format=jsonpretty&limit=20&search=${encodeURIComponent(currentSearchTerm)}`;

      console.log("MainPage: Calling Jamendo API URL:", searchUrl);

      const response = await axios.get(searchUrl); // Menggunakan axios

      console.log("MainPage: Full Jamendo response.data:", response.data); 

      // Hasil dari Jamendo ada di dalam response.data.results (sebuah array track)
      if (response.data && response.data.results && response.data.results.length > 0) {
        setJamendoResults(response.data.results);
        console.log("MainPage: Hasil dari Jamendo ditemukan:", response.data.results);
      } else {
        setJamendoResults([]);
        console.log("MainPage: Tidak ada hasil dari Jamendo.");
        setJamendoError(`Tidak ada lagu ditemukan di Jamendo untuk "${currentSearchTerm}".`);
      }
    } catch (e) {
      console.error("MainPage: Error fetching dari Jamendo:", e);
      let errorMessage = "Gagal mengambil data dari Jamendo.";
      if (e.response) {
          errorMessage += ` Status: ${e.response.status} - ${e.response.statusText}`;
          console.error("Jamendo error response data:", e.response.data);
      }
      setJamendoError(errorMessage);
      setJamendoResults([]);
    } finally {
      setLoadingJamendo(false);
    }
  };

  const audioRef = useRef(null);

  console.log('MainPage Render - currentPlaylist:', currentPlaylist?.name, 'nowPlaying:', nowPlaying?.title);

  // 1. Fetch playlists lokal saat komponen mount (HANYA SATU useEffect INI)
  useEffect(() => {
    const fetchPlaylistsInitial = async () => {
      console.log("MainPage: useEffect[] - Mulai fetch playlists...");
      setLoadingPlaylists(true); setError(null); 
      // setPlaylists([]); // Tidak perlu dikosongkan di sini jika hanya load sekali
      // setCurrentPlaylist(null); // Jangan reset currentPlaylist di sini agar tidak infinite loop jika currentPlaylist jadi dependency
      try {
        const data = await fetchWithAuth('/api/playlists', {}, onLogout);
        console.log("MainPage: useEffect[] - Data playlists mentah dari API:", data);
        if (Array.isArray(data)) {
          setPlaylists(data);
          console.log("MainPage: useEffect[] - State 'playlists' diupdate dengan:", data);
          // Hanya set currentPlaylist jika belum ada DAN ada data playlist
          if (data.length > 0 && !currentPlaylist) { 
            console.log("MainPage: useEffect[] - Ada playlist, set currentPlaylist ke yang pertama:", data[0]);
            setCurrentPlaylist(data[0]);
          } else if (data.length === 0) {
            console.log("MainPage: useEffect[] - Tidak ada playlist dari API, currentPlaylist diset null.");
            setCurrentPlaylist(null);
          }
        } else {
          console.error("MainPage: useEffect[] - Data playlists dari API bukan array:", data);
          setPlaylists([]); setCurrentPlaylist(null);
          setError("Format data playlists dari server tidak sesuai.");
        }
      } catch (e) {
        console.error("MainPage: useEffect[] - Error saat fetch playlists:", e);
        if (e.message && !e.message.toLowerCase().includes('unauthorized')) {
          setError(e.message || "Gagal memuat playlists.");
        }
        setPlaylists([]); setCurrentPlaylist(null);
      } finally {
        setLoadingPlaylists(false);
        console.log("MainPage: useEffect[] - Selesai fetch playlists.");
      }
    };
    fetchPlaylistsInitial();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onLogout]); // onLogout adalah prop, idealnya stabil (useCallback di App.jsx)


  // 2. Fetch lagu lokal untuk currentPlaylist saat currentPlaylist berubah
  useEffect(() => {
  if (currentPlaylist && currentPlaylist.id) {
    const fetchSongsForCurrentPlaylist = async () => { // Ganti nama fungsi agar lebih deskriptif
      // ---- TAMBAHKAN LOG INI ----
      console.log(`MainPage: useEffect[currentPlaylist] - TERPICU. Fetching songs for playlist ID: ${currentPlaylist.id} ("${currentPlaylist.name}")`);
      console.log("MainPage: useEffect[currentPlaylist] - Objek currentPlaylist saat ini:", currentPlaylist);
      // ---------------------------
      setLoadingSongs(true); setSongs([]); setError(null);
      try {
        const data = await fetchWithAuth(`/api/playlists/${currentPlaylist.id}/songs`, {}, onLogout);
        console.log(`MainPage: useEffect[currentPlaylist] - Songs for ${currentPlaylist.name} fetched:`, data);
        setSongs(data || []);
      } catch (e) {
        console.error(`MainPage: useEffect[currentPlaylist] - Gagal fetch songs for ${currentPlaylist.id}:`, e);
        if (!e.message.toLowerCase().includes('unauthorized')) {
          setError(`Gagal memuat lagu untuk playlist ${currentPlaylist.name}: ${e.message}`);
        }
      } finally { setLoadingSongs(false); }
    };
    fetchSongsForCurrentPlaylist();
  } else {
    console.log("MainPage: useEffect[currentPlaylist] - currentPlaylist null atau ID tidak ada, songs dikosongkan.");
    setSongs([]);
  }
}, [currentPlaylist, onLogout]); // Dependency: currentPlaylist dan onLogout


  // --- Handler untuk Player Musik (Lokal) ---
   const handlePlaySong = (song) => {
    console.log('MainPage: handlePlaySong - Target:', song?.title, 'URL:', song?.url);
    if (song && song.url && !song.url.startsWith('URL_MUSIK_DUMMY')) {
      setNowPlaying(song);
      setCurrentTime(0); // Reset currentTime untuk lagu baru
      setSongDuration(0); // Reset songDuration, akan diupdate oleh onLoadedMetadata
      if (audioRef.current) {
        audioRef.current.src = song.url;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => { setIsPlaying(true); console.log("Playback dimulai:", song.title);})
            .catch(error => { 
              console.error("Error auto-play di handlePlaySong:", error); 
              setIsPlaying(false); 
              setSongDuration(0); // Pastikan reset jika play gagal
              setCurrentTime(0);
            });
        } else { // Jika playPromise undefined, coba set isPlaying (beberapa browser mungkin butuh ini)
            setIsPlaying(true); // Mungkin tidak akurat jika play gagal tanpa promise
        }
      }
    } else {
      console.warn("URL lagu tidak valid:", song?.title);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      setNowPlaying(song); setIsPlaying(false); setCurrentTime(0); setSongDuration(0);
    }
  };

  const togglePlayPause = () => {
    console.log('MainPage: togglePlayPause - isPlaying:', isPlaying, 'Now Playing:', nowPlaying);
    if (!audioRef.current || !nowPlaying || !nowPlaying.url || nowPlaying.url.startsWith('URL_MUSIK_DUMMY')) {
      console.log("MainPage: Tidak ada lagu valid atau URL untuk diputar/dijeda.");
      setIsPlaying(false); return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (audioRef.current.src !== nowPlaying.url && nowPlaying.url) {
        audioRef.current.src = nowPlaying.url;
      }
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => { console.error("MainPage: Error saat play di togglePlayPause:", error); setIsPlaying(false);});
      }
    }
    setIsPlaying(!isPlaying);
    console.log("MainPage: togglePlayPause - isPlaying sekarang:", !isPlaying);
  };

  const handleNextSong = () => {
    if (!nowPlaying || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === nowPlaying.id);
    if (currentIndex === -1 && songs.length > 0) { handlePlaySong(songs[0]); return; }
    let nextIndex = (currentIndex + 1) % songs.length;
    handlePlaySong(songs[nextIndex]);
  };

  const handlePreviousSong = () => {
    if (!nowPlaying || songs.length === 0) return;
    const currentIndex = songs.findIndex(s => s.id === nowPlaying.id);
    if (currentIndex === -1 && songs.length > 0) { handlePlaySong(songs[0]); return; }
    let prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    handlePlaySong(songs[prevIndex]);
  };

  // Handler untuk Audio Events dan Seek Bar
  const handleLoadedMetadata = () => {
    console.log('MainPage: handleLoadedMetadata dipanggil');
    if (audioRef.current) {
      const duration = audioRef.current.duration;
      console.log("MainPage: Metadata loaded, audioRef.current.duration:", duration);
      if (!isNaN(duration) && isFinite(duration)) {
        setSongDuration(duration);
      } else {
        setSongDuration(0); 
        console.warn("MainPage: Durasi audio tidak valid dari onLoadedMetadata:", duration);
      }
    } else {
      console.log('MainPage: handleLoadedMetadata - audioRef.current adalah null');
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
    }
  };

  const handleSeek = (event) => {
    if (audioRef.current && nowPlaying) {
      const newTime = Number(event.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      console.log('MainPage: handleSeek - Seek ke waktu:', newTime, 'untuk lagu:', nowPlaying.title);
    }
  };

  // --- Handler untuk Manajemen Playlist Lokal ---
  const handlePlaylistChange = (playlist) => {
    console.log("MainPage: handlePlaylistChange - Pindah ke:", playlist.name);
    setCurrentPlaylist(playlist);
  };
  
  const handleCreatePlaylist = async () => {
    const newPlaylistName = window.prompt("Masukkan nama untuk playlist baru:");
    if (newPlaylistName && newPlaylistName.trim() !== "") {
      setActionMessage('Membuat playlist...'); setError(null);
      try {
        const responseData = await fetchWithAuth('/api/playlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newPlaylistName.trim() }),
        }, onLogout);
        // Jika tidak ada error yang dilempar, berarti sukses (201)
        setPlaylists(prevPlaylists => [...prevPlaylists, responseData]);
        setActionMessage(`Playlist "${responseData.name}" berhasil dibuat!`);
        setCurrentPlaylist(responseData); 
      } catch (e) { 
        console.error('MainPage: Error saat create playlist:', e);
        setActionMessage(`Error: ${e.message}`);
      } finally {
        setTimeout(() => setActionMessage(''), 3000);
      }
    } /* ... sisa logika prompt ... */
  };
  
  const handleDeletePlaylist = async (playlistIdToDelete) => {
    if (!playlistIdToDelete) return;
    const playlistToDelete = playlists.find(p => p.id === playlistIdToDelete);
    if (!playlistToDelete) { setActionMessage(`Error: Playlist ID ${playlistIdToDelete} tidak ditemukan.`); setTimeout(() => setActionMessage(''), 3000); return; }
    if (!window.confirm(`Yakin hapus playlist "${playlistToDelete.name}"?`)) return;
    setActionMessage(`Menghapus playlist "${playlistToDelete.name}"...`); setError(null);
    try {
      const responseData = await fetchWithAuth(`/api/playlists/${playlistIdToDelete}`, { method: 'DELETE' }, onLogout);
        // Jika backend mengembalikan JSON message pada 200 OK untuk DELETE:
        setActionMessage(responseData?.message || `Playlist berhasil dihapus.`);
        // Jika backend 204 No Content, responseData akan null dari fetchWithAuth kita
        if (responseData === null) setActionMessage(`Playlist berhasil dihapus.`);

        const updatedPlaylists = playlists.filter(p => p.id !== playlistIdToDelete);
        setPlaylists(updatedPlaylists);
        if (currentPlaylist && currentPlaylist.id === playlistIdToDelete) {
            setCurrentPlaylist(updatedPlaylists.length > 0 ? updatedPlaylists[0] : null);
        }
      } catch (e) {
        console.error('MainPage: Error saat delete playlist:', e);
        setActionMessage(`Error: ${e.message}`);
      } finally {
        setTimeout(() => setActionMessage(''), 4000);
      }
  };

const handleAddToPlaylist = async (songToAdd) => {
  if (!songToAdd || !songToAdd.id) {
    setActionMessage('Error: Tidak ada lagu yang dipilih untuk ditambahkan.');
    setTimeout(() => setActionMessage(''), 3000);
    return;
  }
  if (!currentPlaylist || !currentPlaylist.id) {
    setActionMessage('Error: Tidak ada playlist yang aktif. Pilih playlist dulu.');
    setTimeout(() => setActionMessage(''), 3000);
    return;
  }

  console.log(`MainPage: [AddToPlaylist] Menambahkan lagu ID: ${songToAdd.id} ("${songToAdd.title}") ke Playlist ID: ${currentPlaylist.id} ("${currentPlaylist.name}")`);
  setActionMessage(`Menambahkan "${songToAdd.title}" ke "${currentPlaylist.name}"...`);
  setError(null);

  try {
    const responseData = await fetchWithAuth(
      `/api/playlists/${currentPlaylist.id}/songs`, 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_object: { // Mengirim sebagai song_object untuk lagu baru
            title: songToAdd.title, // Asumsi songToAdd punya struktur ini jika dari Jamendo
            artist: songToAdd.artist,
            url: songToAdd.url,
            album: songToAdd.album_name || songToAdd.album || 'N/A',
            source: songToAdd.source || 'jamendo', // Jika dari Jamendo, songToAdd bisa punya field source
            original_id: songToAdd.original_id || songToAdd.id // ID asli dari Jamendo
        } }),
      },
      onLogout
    );

    console.log('MainPage: [AddToPlaylist] Respons mentah dari backend:', responseData); // <-- LOG 1

    if (responseData && responseData.playlist) { // Pastikan responseData dan responseData.playlist ada
      setActionMessage(responseData.message || `Lagu "${songToAdd.title}" berhasil ditambahkan.`);
      
      console.log('MainPage: [AddToPlaylist] currentPlaylist SEBELUM di-set:', currentPlaylist);
      console.log('MainPage: [AddToPlaylist] responseData.playlist dari backend (yang akan di-set):', responseData.playlist);
      
      setCurrentPlaylist(responseData.playlist); // Ini seharusnya memicu useEffect untuk fetch songs
                                                  // karena responseData.playlist adalah objek BARU dari backend.
      
      console.log('MainPage: [AddToPlaylist] PANGGILAN setCurrentPlaylist(responseData.playlist) sudah dilakukan.');

    } else {
      // Jika backend tidak mengembalikan playlist terupdate atau responseData tidak sesuai harapan
      console.error('MainPage: [AddToPlaylist] Backend tidak mengembalikan objek playlist yang valid di respons:', responseData);
      setActionMessage(`Error: Respons tidak valid dari server setelah menambah lagu.`);
    }

  } catch (e) {
    console.error('MainPage: [AddToPlaylist] Gagal menambahkan lagu ke playlist:', e);
    setActionMessage(`Error: ${e.message || 'Gagal menambahkan lagu.'}`);
  } finally {
    setTimeout(() => setActionMessage(''), 4000);
  }
};

  const handleAddNowPlayingToCurrentPlaylist = async () => {
    if (!nowPlaying || !nowPlaying.id) { // Perlu ada lagu yang sedang aktif (atau setidaknya dipilih)
      setActionMessage('Error: Tidak ada lagu yang sedang diputar untuk ditambahkan.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    if (!currentPlaylist || !currentPlaylist.id) {
      setActionMessage('Error: Pilih playlist lokal dulu untuk menambahkan lagu ini.');
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }

    console.log(`MainPage: Menambahkan lagu (nowPlaying) "<span class="math-inline">\{nowPlaying\.title\}" ke playlist lokal "</span>{currentPlaylist.name}"`);
    setActionMessage(`Menambahkan "<span class="math-inline">\{nowPlaying\.title\}" ke "</span>{currentPlaylist.name}"...`);
    setError(null);

    // Cek duplikasi: Apakah lagu dengan original_id & source yang sama sudah ada di playlist?
    const isDuplicate = songs.some(song => {
      // Cek baik untuk lagu lokal maupun Jamendo
      if (song.source && song.original_id) {
      return (
        song.source === (nowPlaying.source || (nowPlaying.id.startsWith('jamendo-') ? 'jamendo' : 'local')) &&
        String(song.original_id) === String(nowPlaying.original_id || (nowPlaying.id.startsWith('jamendo-') ? nowPlaying.id.substring(8) : nowPlaying.id))
      );
      }
      // Fallback: jika tidak ada source/original_id, bandingkan title, artist, dan url
      return (
      song.title === nowPlaying.title &&
      song.artist === nowPlaying.artist &&
      song.url === nowPlaying.url
      );
    });

    if (isDuplicate) {
      setActionMessage(`Lagu "${nowPlaying.title}" sudah ada di playlist "${currentPlaylist.name}".`);
      setTimeout(() => setActionMessage(''), 3000);
      return;
    }
    // Siapkan data lagu yang akan dikirim ke backend.
    // Kita perlu 'source' dan 'original_id' jika nowPlaying berasal dari sumber eksternal seperti Jamendo.
    // Jika nowPlaying adalah lagu lokal, ID-nya sudah ID lokal.
    const songDataToSend = {
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      url: nowPlaying.url,
      album: nowPlaying.album_name || nowPlaying.album || 'N/A', // Sesuaikan dengan struktur objek nowPlaying
      // 'source' dan 'original_id' penting jika nowPlaying bisa dari Jamendo
      // Jika nowPlaying.id sudah dipastikan unik secara global (misal "jamendo-xxxxx" atau "local-yyyyy")
      // maka backend bisa parsing dari situ.
      // Untuk sekarang, kita asumsikan nowPlaying.id adalah ID unik global (bisa jadi ID Jamendo atau ID lokal)
      // dan kita tambahkan source jika ada.
      source: nowPlaying.source || (nowPlaying.id.startsWith('jamendo-') ? 'jamendo' : 'local'),
      original_id: nowPlaying.original_id || (nowPlaying.id.startsWith('jamendo-') ? nowPlaying.id.substring(8) : nowPlaying.id)
    };
    // Jika nowPlaying adalah lagu lokal murni, 'original_id' bisa jadi 'id' lokalnya, dan 'source' adalah 'local'.
    // Backend akan menggunakan kombinasi source & original_id untuk cek duplikasi di ALL_SONGS_DB.

    try {
      const responseData = await fetchWithAuth(
        `/api/playlists/${currentPlaylist.id}/songs`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Backend kita mengharapkan 'song_object' jika mengirim detail lagu baru
          // atau 'song_id' jika mengirim ID lagu lokal yang sudah ada.
          // Karena nowPlaying bisa jadi lagu Jamendo (yang belum ada ID lokalnya)
          // atau lagu lokal (yang sudah punya ID lokal), kita selalu kirim song_object
          // agar backend yang menentukan apakah perlu buat entri baru di ALL_SONGS_DB.
          body: JSON.stringify({ song_object: songDataToSend }),
        },
        onLogout
      );

      console.log('MainPage: Respons dari backend setelah coba tambah nowPlaying ke playlist:', responseData);
      setActionMessage(responseData.message || `Lagu "<span class="math-inline">\{nowPlaying\.title\}" diproses untuk playlist "</span>{currentPlaylist.name}".`);

      if (responseData && responseData.playlist) {
        setCurrentPlaylist(responseData.playlist); // Ini akan memicu useEffect untuk refresh daftar lagu
      } else {
        // Fallback jika backend tidak mengembalikan playlist terupdate
        console.warn("Backend tidak mengembalikan objek playlist setelah menambah lagu. Merefresh lagu secara manual.");
        setCurrentPlaylist(prev => prev ? { ...prev } : null);
      }

    } catch (e) {
      console.error('MainPage: Gagal menambahkan nowPlaying ke playlist:', e);
      setActionMessage(`Error: ${e.message || 'Gagal menambahkan lagu.'}`);
    } finally {
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const handleRemoveSongFromPlaylist = async (songIdToRemove) => {
    if (!currentPlaylist || !currentPlaylist.id || !songIdToRemove) {
      setActionMessage('Error: Data tidak lengkap untuk hapus lagu.'); setTimeout(() => setActionMessage(''), 3000); return;
    }
    const songToRemove = songs.find(s => s.id === songIdToRemove);
    if (!window.confirm(`Yakin hapus lagu "${songToRemove?.title || 'ini'}" dari playlist "${currentPlaylist.name}"?`)) return;

    setActionMessage(`Menghapus "${songToRemove?.title || 'lagu'}" dari "${currentPlaylist.name}"...`); setError(null);
    try {
      const responseData = await fetchWithAuth(
        `/api/playlists/${currentPlaylist.id}/songs/${songIdToRemove}`, 
        { method: 'DELETE' }, 
        onLogout
      );
      
      setActionMessage(responseData?.message || `Lagu "${songToRemove?.title || ''}" berhasil dihapus.`);
      // Jika backend mengembalikan playlist yang terupdate di responseData.playlist
      if (responseData && responseData.playlist) {
        setCurrentPlaylist(responseData.playlist); // Ini akan memicu useEffect untuk fetch songs
      } else {
        // Jika backend tidak mengembalikan playlist (misal hanya 204 atau pesan),
        // kita perlu memicu fetch songs untuk currentPlaylist secara manual.
        // Membuat objek baru untuk currentPlaylist akan memicu useEffect.
        console.warn("MainPage: Backend tidak mengembalikan objek playlist setelah remove song. Memicu refresh lagu manual.");
        setCurrentPlaylist(prev => prev ? { ...prev } : null); 
      }

      if (nowPlaying && nowPlaying.id === songIdToRemove) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
        setNowPlaying(null); setIsPlaying(false);
        setCurrentTime(0); setSongDuration(0);
      }
    } catch (e) {
      console.error('MainPage: Error saat remove song from playlist:', e);
      setActionMessage(`Error: ${e.message}`);
    } finally {
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const handleAddJamendoTrackToCurrentPlaylist = async (jamendoTrack) => {
  if (!currentPlaylist || !currentPlaylist.id) {
    setActionMessage("Error: Pilih atau buat playlist lokal dulu untuk menambahkan lagu ini.");
    setTimeout(() => setActionMessage(''), 4000);
    return;
  }
  if (!jamendoTrack || !jamendoTrack.audio) { // Pastikan ada URL audio dari Jamendo
    setActionMessage("Error: Lagu Jamendo ini tidak memiliki URL audio untuk ditambahkan.");
    setTimeout(() => setActionMessage(''), 4000);
    return;
  }

  console.log(`MainPage: Menambahkan lagu Jamendo ${jamendoTrack.name} ke playlist lokal ${currentPlaylist.name}`);
  setActionMessage(`Menambahkan "${jamendoTrack.name}"...`);
  setError(null);

  // Siapkan data lagu yang akan dikirim ke backend.
  // Backend kita perlu tahu kalau ini lagu baru yang detailnya perlu disimpan.

  // Cek duplikasi: Apakah lagu Jamendo ini sudah ada di playlist lokal (berdasarkan source & original_id)
  const isDuplicate = songs.some(song =>
    song.source === 'jamendo' &&
    String(song.original_id) === String(jamendoTrack.id)
  );
  if (isDuplicate) {
    setActionMessage(`Lagu "${jamendoTrack.name}" sudah ada di playlist "${currentPlaylist.name}".`);
    setTimeout(() => setActionMessage(''), 3000);
    return;
  }

  const newSongDataForBackend = {
    title: jamendoTrack.name,
    artist: jamendoTrack.artist_name,
    url: jamendoTrack.audio, // URL streaming penuh dari Jamendo
    album: jamendoTrack.album_name || 'N/A', // Opsional
    source: 'jamendo', // Tandai sumbernya
    original_id: jamendoTrack.id // Simpan ID asli dari Jamendo
  };

  try {
    // Kita akan POST ke endpoint yang sama untuk menambah lagu ke playlist,
    // tapi dengan body yang berbeda (objek lagu penuh, bukan hanya song_id)
    // Backend perlu dimodifikasi untuk menangani ini.
    const responseData = await fetchWithAuth(
      `/api/playlists/${currentPlaylist.id}/songs`, 
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ song_object: newSongDataForBackend }), // Kirim objek lagu
      },
      onLogout
    );

    console.log('MainPage: Respons dari backend setelah coba tambah lagu Jamendo:', responseData);
    setActionMessage(responseData.message || `Lagu "${jamendoTrack.name}" mungkin telah diproses.`);

    // Jika backend berhasil dan mengembalikan playlist terupdate,
    // setCurrentPlaylist akan memicu refresh daftar lagu.
    if (responseData.playlist) {
      setCurrentPlaylist(responseData.playlist);
    } else {
      // Jika backend hanya memberi pesan tanpa data playlist,
      // kita bisa coba refresh manual (kurang ideal)
      console.warn("Backend tidak mengembalikan objek playlist setelah menambah lagu Jamendo. Merefresh lagu secara manual.");
      setCurrentPlaylist(prev => prev ? { ...prev } : null);
    }

  } catch (e) {
    console.error('MainPage: Gagal menambahkan lagu Jamendo ke playlist:', e);
    setActionMessage(`Error: ${e.message || 'Gagal menambahkan lagu Jamendo.'}`);
  } finally {
    setTimeout(() => setActionMessage(''), 4000);
  }
};

  // Logika Filter Lagu untuk Search Lokal (Client-Side)
  const filteredSongs = songs.filter(song => {
    if (!searchTerm.trim()) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return song.title.toLowerCase().includes(lowerSearchTerm) || song.artist.toLowerCase().includes(lowerSearchTerm);
  });

  // --- JSX Return ---
  if (loadingPlaylists) {
    return <div className="flex-1 flex items-center justify-center pt-20 text-brand-dark-text-primary bg-brand-dark-bg">Bentar bre, lagi ambil playlist...</div>;
  }
  if (error && playlists.length === 0 && !actionMessage) { // Hanya tampilkan error utama jika tidak ada playlist sama sekali
    return <div className="flex-1 flex items-center justify-center pt-20 text-red-400 bg-brand-dark-bg">{error}</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-brand-dark-bg text-brand-dark-text-primary overflow-hidden pt-16 sm:pt-20">
      {/* Search Bar Area */}
      <div className="px-4 sm:px-6 py-4 flex items-center gap-2 sm:gap-4 border-b border-brand-dark-border">
        <div className="flex-grow">
          <input
            type="search"
            placeholder="Cari di playlist / Eksplor..."
            className="w-full p-2 sm:p-3 bg-brand-dark-card rounded-lg border border-brand-dark-border focus:ring-2 focus:ring-brand-dark-blue-accent focus:border-transparent outline-none placeholder-brand-dark-text-secondary text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') searchOnJamendo(); }}
          />
        </div>

        <button 
          onClick={searchOnJamendo} // Panggil fungsi baru
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg text-sm sm:text-base transition-colors" // Warna baru
          disabled={loadingJamendo || !searchTerm.trim()}
        >
          {loadingJamendo ? 'Mencari...' : 'Eksplor'}
        </button>
      </div>

      <audio 
        ref={audioRef} 
        onEnded={() => { if(isPlaying) {handleNextSong();} else {setIsPlaying(false);}}} 
        onError={(e) => { console.error("MainPage: Audio Element Error:", e.nativeEvent?.target?.error); setIsPlaying(false); setSongDuration(0); setCurrentTime(0); }}
        onLoadedMetadata={handleLoadedMetadata} 
        onTimeUpdate={handleTimeUpdate}         
      />

      {actionMessage && (
        <div className={`mx-4 sm:mx-6 my-2 p-3 rounded-md text-sm text-center ${actionMessage.startsWith('Error:') ? 'bg-red-700 text-red-100' : 'bg-green-700 text-green-100'}`}>
            {actionMessage}
        </div>
      )}
      {error && !loadingPlaylists && !actionMessage && playlists.length > 0 && ( 
            <div className="mx-4 sm:mx-6 my-2 p-3 rounded-md text-sm text-center bg-red-700 text-red-100">
                {error} 
            </div>
      )}
      {jamendoError && !loadingJamendo && !actionMessage && ( 
            <div className={`mx-4 sm:mx-6 my-2 p-3 rounded-md text-sm text-center bg-yellow-700 text-yellow-100`}>
                {jamendoError}
            </div> 
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-2/5 lg:w-1/4 bg-brand-dark-bg p-4 sm:p-6 border-r border-brand-dark-border flex flex-col items-center overflow-y-auto overflow-x-hidden">
          <div className="relative mb-4 w-48 h-48 sm:w-60 sm:h-60 lg:w-72 lg:h-72">
            <div className="bg-black w-full h-full rounded-full flex items-center justify-center shadow-lg">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-brand-dark-card rounded-full border-4 border-brand-dark-bg"></div>
            </div>
            {nowPlaying && (
              <button 
                onClick={handleAddNowPlayingToCurrentPlaylist} // PANGGIL FUNGSI INI
                className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 bg-brand-dark-blue-accent text-white p-2 rounded-full hover:bg-opacity-80 transition-opacity" 
                title={`Tambah "${nowPlaying.title}" ke playlist "${currentPlaylist?.name || 'saat ini'}"`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
          <div className="text-center mb-2 w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-brand-dark-text-primary truncate" title={nowPlaying?.title}>{nowPlaying?.title || 'Pilih lagu'}</h3>
            <p className="text-sm sm:text-base text-brand-dark-text-secondary truncate" title={nowPlaying?.artist}>{nowPlaying?.artist || 'Untuk diputar'}</p>
          </div>
          {nowPlaying && (
            <div className="w-full px-2 sm:px-4 mb-3"> {/* Perbaikan typo: className */}
              <input 
                type="range" 
                min="0"
                max={songDuration || 0} 
                value={currentTime}    
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-dark-blue-accent disabled:opacity-50" // Perbaikan typo: appearance-none
                disabled={!nowPlaying || songDuration === 0 || !isFinite(songDuration)} 
              />
              <div className="flex justify-between text-xs text-brand-dark-text-secondary mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(songDuration)}</span>
              </div>
            </div>
          )}
          <div className="flex items-center justify-center space-x-4 sm:space-x-6 mt-4"> {/* Pastikan ada mt-4 jika seek bar hilang atau muncul */}
            <button onClick={handlePreviousSong} disabled={!nowPlaying || songs.length < 2} className="text-brand-dark-text-secondary hover:text-brand-dark-text-primary transition-colors disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg></button>
            <button onClick={togglePlayPause} disabled={!nowPlaying || !nowPlaying.url || nowPlaying.url.startsWith('URL_MUSIK_DUMMY')} className="p-2 sm:p-3 bg-brand-dark-blue-accent text-white rounded-full shadow-lg hover:bg-opacity-80 transition-opacity disabled:opacity-50"> {isPlaying ? (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" /></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>)}</button>
            <button onClick={handleNextSong} disabled={!nowPlaying || songs.length < 2} className="text-brand-dark-text-secondary hover:text-brand-dark-text-primary transition-colors disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg></button>
          </div>
        </aside>

        <main className="flex-1 bg-brand-dark-card p-4 sm:p-6 overflow-y-auto">
          {currentPlaylist && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-brand-dark-text-primary">{currentPlaylist.name} (Lokal)</h2>
                <button onClick={() => handleDeletePlaylist(currentPlaylist.id)} className="text-red-500 hover:text-red-400" title="Hapus Playlist"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
              {loadingSongs && <p className="text-brand-dark-text-secondary text-center py-4">Memuat lagu untuk '{currentPlaylist?.name}'...</p>}
              {!loadingSongs && filteredSongs.length === 0 && currentPlaylist && !error && searchTerm &&
                <p className="text-brand-dark-text-secondary text-center py-4">Lokal: Tidak ada lagu cocok dengan "{searchTerm}" di playlist '{currentPlaylist.name}'.</p>
              }
              {!loadingSongs && filteredSongs.length === 0 && currentPlaylist && !error && !searchTerm &&
                <p className="text-brand-dark-text-secondary text-center py-4">Playlist '{currentPlaylist.name}' masih kosong. Tambahkan lagu!</p>
              }
              <div className="space-y-2">
                {filteredSongs.map((song) => {
                  const isCurrentlyPlaying = nowPlaying?.id === song.id;
                  return (
                    <div key={song.id} className={`flex items-center justify-between p-2 sm:p-3 rounded-md hover:bg-brand-dark-bg hover:bg-opacity-70 cursor-pointer transition-all group ${isCurrentlyPlaying ? 'bg-brand-dark-blue-accent bg-opacity-30' : 'bg-brand-dark-bg'}`} onClick={() => handlePlaySong(song)}>
                      <div>
                        <p className={`font-medium text-sm sm:text-base group-hover:text-brand-dark-blue-accent ${isCurrentlyPlaying ? 'text-brand-dark-blue-accent' : 'text-brand-dark-text-primary'}`}>{song.title}</p>
                        <p className="text-xs sm:text-sm text-brand-dark-text-secondary">{song.artist}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveSongFromPlaylist(song.id); }} className="text-brand-dark-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Hapus dari Playlist"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!currentPlaylist && playlists.length > 0 && !loadingPlaylists &&
            <p className="text-brand-dark-text-secondary text-center py-4">Pilih atau buat playlist untuk memulai.</p>
          }

          {/* Hasil Eksplor */}
          {(loadingJamendo || jamendoResults.length > 0 || jamendoError) && (
            <div className="mt-8 pt-6 border-t border-brand-dark-border">
                <h2 className="text-xl sm:text-2xl font-bold text-brand-dark-text-primary mb-4">Hasil dari Jamendo</h2>
                {loadingJamendo && <p className="text-brand-dark-text-secondary">Mencari di Jamendo...</p>}
                {jamendoError && !loadingJamendo && <p className="text-red-400">{jamendoError}</p>}
                {!loadingJamendo && jamendoResults.length === 0 && searchTerm && !jamendoError && 
                    <p className="text-brand-dark-text-secondary">Jamendo: Tidak ada hasil ditemukan untuk "{searchTerm}".</p>
                }
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {jamendoResults.map((track) => (
                    <div 
                      key={track.id} 
                      className="p-3 bg-brand-dark-bg rounded-md shadow flex flex-col justify-between"
                    >
                      
                      <div>
                        {track.image && ( // Jamendo menyediakan field 'image' untuk cover album
                          <img 
                            src={track.image} 
                            alt={track.name} 
                            className="w-full h-40 sm:h-48 object-cover rounded mb-2" 
                            onClick={() => handlePlaySong({ 
                              id: `jamendo-${track.id}`, // Buat ID unik untuk player lokal
                              title: track.name, 
                              artist: track.artist_name, 
                              url: track.audio // <--- INI URL MP3 PENUHNYA
                            })}
                          />
                        )}
                        <p className="font-semibold text-brand-dark-text-primary truncate" title={track.name}>
                            {track.name || "Judul Tidak Diketahui"}
                        </p>
                        <p className="text-xs text-brand-dark-text-secondary truncate" title={track.artist_name}>
                          {track.artist_name || "Artis Tidak Diketahui"}
                        </p>
                        {track.album_name && (
                          <p className="text-xs text-brand-dark-text-secondary truncate" title={track.album_name}>
                            Album: {track.album_name}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 flex flex-col space-y-1">
                        {track.audio && ( // Jika ada URL audio (streaming MP3 penuh)
                          <button
                            onClick={() => handlePlaySong({ 
                              id: `jamendo-${track.id}`, // Buat ID unik untuk player lokal
                              title: track.name, 
                              artist: track.artist_name, 
                              url: track.audio // <--- INI URL MP3 PENUHNYA
                            })}
                            className="w-full text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded transition-colors"
                          >
                            Putar Lagu
                          </button>
                        )}
                        
                        {track.audio && currentPlaylist && ( // Tampilkan hanya jika ada URL audio dan ada playlist lokal aktif
                          <button
                              onClick={() => handleAddJamendoTrackToCurrentPlaylist(track)}
                              className="w-full text-xs bg-sky-500 hover:bg-sky-600 text-white py-1 px-2 rounded transition-colors"
                              title={`Tambah ke playlist lokal: ${currentPlaylist.name}`}
                          >
                              + Ke Playlist Lokal
                          </button>
                        )}

                        {track.audiodownload && ( // Link download jika ada
                          <a 
                            href={track.audiodownload} 
                            target="_blank" // Biasanya akan redirect, jadi buka di tab baru
                            rel="noopener noreferrer" 
                            className="w-full block text-center text-xs bg-slate-600 hover:bg-slate-500 text-slate-100 py-1 px-2 rounded"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                ))}
                </div>
            </div>
          )}
        </main>
      </div>

      <div className="px-4 sm:px-6 py-3 bg-brand-dark-card border-t border-brand-dark-border flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scroll_bar-hidden">
          {playlists.map(pl => {
            if (!pl || typeof pl.id === 'undefined' || typeof pl.name === 'undefined') {
              console.warn("MainPage: Invalid playlist item in map (bottom bar):", pl);
              return null; 
            }
            return (
              <button key={pl.id} onClick={() => handlePlaylistChange(pl)}
                className={`whitespace-nowrap py-2 px-3 rounded-md text-sm font-medium transition-colors ${currentPlaylist?.id === pl.id ? 'bg-brand-dark-blue-accent text-white' : 'bg-brand-dark-bg text-brand-dark-text-secondary hover:bg-opacity-70'}`}>
                {pl.name}
              </button>
            );
          })}
        </div>
        <button onClick={handleCreatePlaylist} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors whitespace-nowrap">
          Tambah Playlist
        </button>
      </div>
    </div>
    
  );
}
export default MainPage;