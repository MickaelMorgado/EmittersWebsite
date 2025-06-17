import './App.css'
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import PNLCalendar from './pages/PNLCalendar';
import HipsExample from './pages/HipsExample';

const App = () => {
  return (
    <Routes>
      {/*       <Route index element={<Home />} />
      <Route path="/pnl-calendar" element={<PNLCalendar />} />
      <Route path="/hips" element={<HipsExample />} /> */}
    </Routes>
  )
}

export default App