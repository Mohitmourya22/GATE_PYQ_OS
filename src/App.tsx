import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Bank from './pages/Bank'
import Practice from './pages/Practice'
import Topics from './pages/Topics'
import Mock from './pages/Mock'
import Bookmarks from './pages/Bookmarks'
import Analytics from './pages/Analytics'
import DataNotes from './pages/DataNotes'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/questions" element={<Bank />} />
        <Route path="/practice/:id" element={<Practice />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/mock" element={<Mock />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/data-notes" element={<DataNotes />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
