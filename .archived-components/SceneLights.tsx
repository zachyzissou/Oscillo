'use client'
import React, { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

export default function SceneLights() {
  const { scene } = useThree()

  useEffect(() => {
    const ambient = new THREE.AmbientLight(0x404050, 0.3)
    const rim = new THREE.SpotLight(0x88caff, 1.0, 50, Math.PI / 4, 0.5, 1)
    rim.position.set(-10, 15, 10)
    const warm = new THREE.PointLight(0xffa15d, 0.6, 60)
    warm.position.set(0, -5, 0)
    const accent1 = new THREE.PointLight(0x7c3aed, 0.8, 40)
    accent1.position.set(5, 8, -5)
    const accent2 = new THREE.PointLight(0x14b8a6, 0.8, 40)
    accent2.position.set(-5, 8, 5)
    rim.castShadow = true
    const lights = [ambient, rim, warm, accent1, accent2]
    lights.forEach(light => scene.add(light))
    return () => lights.forEach(light => scene.remove(light))
  }, [scene])

  return null
}
