import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Editor from './editor/Editor'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Editor />} />
        <Route path="/project/:id" element={<Editor />} />
      </Routes>
    </BrowserRouter>
  )
}
