import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/article/:id" element={<ArticlePage />} />
      </Routes>
    </Router>
  );
}

export default App;
