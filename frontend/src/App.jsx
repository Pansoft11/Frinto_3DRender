import { Component } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Editor from './editor/Editor'
import './App.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error">
          <h1>Error loading app</h1>
          <p>Open the browser console for details.</p>
        </div>
      )
    }

    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Editor />} />
          <Route path="/project/:id" element={<Editor />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
