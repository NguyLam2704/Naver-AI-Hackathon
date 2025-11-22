import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import InterviewChatbot from './layouts/InterviewChatbot';
import ResultPage from './layouts/ResultPage/ResultPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InterviewChatbot />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}

export default App;
