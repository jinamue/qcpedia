import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Chatbot from './chatbot';
import Home from './pages/Home';
import Categories from './pages/Categories';
import About from './pages/About';
import Contact from './pages/Contact';
import InstruksiKerjaQC from './categories/InstruksiKerjaQC';
import ListIKdanForm from './categories/ListIKdanForm';
import ProsedurQC from './categories/Prosedur QC';
import SpesifikasiProduk from './categories/SpesifikasiProduk';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/categories/instruksi-kerja-qc" element={<InstruksiKerjaQC />} />
        <Route path="/categories/list-ik-dan-form" element={<ListIKdanForm />} />
        <Route path="/categories/prosedur-qc" element={<ProsedurQC />} />
        <Route path="/categories/spesifikasi-produk" element={<SpesifikasiProduk />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
