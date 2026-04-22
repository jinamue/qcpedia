import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Chatbot from './chatbot';
import Home from './pages/Home';
import Categories from './pages/Categories';
import About from './pages/About';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Chatbot />
    </BrowserRouter>
  );
}

export default App;
