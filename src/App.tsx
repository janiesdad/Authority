import React from 'react'
import MidiPianoApp from './MidiPianoApp'
import Button from './components/Button'

export default function App() {
  return (
    <>
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex gap-3">
        <Button variant="primary" size="md">Primary</Button>
        <Button variant="secondary" size="md">Secondary</Button>
        <Button variant="tertiary" size="md">Tertiary</Button>
      </div>
      <MidiPianoApp />
    </>
  )
}

