import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Tracks from './pages/Tracks';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/tracks" element={<Tracks />} />
        {/* bisa tambah route lain di sini */}
      </Routes>
    </Router>
  );
}

export default App;
