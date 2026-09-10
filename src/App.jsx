import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FeedbackWall } from './components/views/FeedbackWall';
import { MeTab } from './components/views/MeTab';
import { TopHeader } from './components/layout/TopHeader';
import { Sidebar } from './components/layout/Sidebar';
import './styles/theme.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Top Navigation Header */}
        <TopHeader />
        
        {/* Main Content Area */}
        <div className="main-content-area">
          {/* Sidebar - Shows current user info and navigation */}
          <Sidebar />
          
          {/* Route Views */}
          <Routes>
            {/* Feedback Wall View */}
            <Route path="/" element={<FeedbackWall />} />
            
            {/* Personal Dashboard View */}
            <Route path="/me" element={<MeTab />} />
            
            {/* Default fallback to feedback wall */}
            <Route path="*" element={<FeedbackWall />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;