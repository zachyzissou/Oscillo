"use client"
import React from "react"
import dynamic from 'next/dynamic'

const ImmersiveMusicalUniverse = dynamic(() => import('../src/components/ImmersiveMusicalUniverse'), { ssr: false })


export default function Home() {
  return (
    <main
      id="main-content"
      data-testid="main-content"
      role="main"
      tabIndex={-1}
      aria-label="Interactive 3D music experience"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#000011'
      }}
    >
      <ImmersiveMusicalUniverse />
    </main>
  )
}
