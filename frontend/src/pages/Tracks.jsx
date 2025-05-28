import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Tracks() {
  const [tracks, setTracks] = useState([]);

  useEffect(() => {
    api.get('/tracks')
      .then(res => {
        console.log("Respon dari backend:", res.data);
        setTracks(res.data.data);
      })
      .catch(err => {
        console.error('Gagal ambil data tracks:', err);
      });
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Daftar Lagu</h2>
      {tracks.length === 0 ? (
        <p className="text-gray-500">Belum ada data.</p>
      ) : (
        <ul>
          {tracks.map(track => (
            <li key={track.id} className="mb-4 p-4 bg-white shadow rounded">
              <h3 className="text-lg font-semibold">{track.title}</h3>
              <p className="text-sm text-gray-600">{track.artist}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
