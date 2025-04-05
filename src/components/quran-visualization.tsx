'use client'

import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { interpolateRainbow } from 'd3-scale-chromatic'
import type { VerseData } from '@/app/page'
import ClusterLabel from './ClusterLabel'

type PointProps = {
  position: [number, number, number]
  color: string
  verse: VerseData
  onSelect: (verse: VerseData) => void
  isSelected: boolean
}

// Individual point component remains similar.
const Point = ({ position, color, verse, onSelect, isSelected }: PointProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(() => {
    if (!meshRef.current) return
    if (isSelected) {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1.3, 0.1)
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1.3, 0.1)
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1.3, 0.1)
    } else {
      meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, 1, 0.1)
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, 0.1)
      meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, 1, 0.1)
    }
  })
  
  return (
    <mesh ref={meshRef} position={position} onClick={() => onSelect(verse)}>
      <sphereGeometry args={[0.015, 8, 8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={isSelected ? 'white' : color}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
    </mesh>
  )
}

type PointCloudProps = {
  data: VerseData[]
  onSelectVerse: (verse: VerseData) => void
}

const QuranVisualization = ({ data, onSelectVerse }: PointCloudProps) => {
  const [selectedVerse, setSelectedVerse] = useState<VerseData | null>(null)
  
  // Compute normalized positions and compute groupings by core_meaning.
  const { normalizedData, colorScale, clusterCentroids } = useMemo(() => {
    if (!data.length) return { 
      normalizedData: [], 
      colorScale: () => '#ffffff',
      clusterCentroids: {}
    }
    
    // Compute bounds for normalization.
    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    data.forEach(point => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      minZ = Math.min(minZ, point.z)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
      maxZ = Math.max(maxZ, point.z)
    })
    
    const spreadFactor = 4
    const normalizedData = data.map(point => ({
      ...point,
      normalizedX: ((point.x - minX) / (maxX - minX) * 2 - 1) * spreadFactor,
      normalizedY: ((point.y - minY) / (maxY - minY) * 2 - 1) * spreadFactor,
      normalizedZ: ((point.z - minZ) / (maxZ - minZ) * 2 - 1) * spreadFactor,
    }))
    
    // Create a color scale based on unique core_meaning strings.
    const uniqueCores = Array.from(new Set(normalizedData.map(p => p.core_meaning.trim()))).sort()
    const numCores = uniqueCores.length
    const colorScale = (core: string) => {
      const index = uniqueCores.indexOf(core.trim())
      if (index === -1 || numCores === 1) return '#ffffff'
      const normalizedValue = index / (numCores - 1)
      return interpolateRainbow(normalizedValue)
    }
    
    // Compute cluster centroids by grouping points with the same core meaning.
    const clusterCentroids: Record<string, [number, number, number]> = {}
    uniqueCores.forEach(core => {
      const clusterPoints = normalizedData.filter(p => p.core_meaning.trim() === core)
      if (clusterPoints.length > 0) {
        const avgX = clusterPoints.reduce((sum, p) => sum + p.normalizedX, 0) / clusterPoints.length
        const avgY = clusterPoints.reduce((sum, p) => sum + p.normalizedY, 0) / clusterPoints.length
        const avgZ = clusterPoints.reduce((sum, p) => sum + p.normalizedZ, 0) / clusterPoints.length
        clusterCentroids[core] = [avgX, avgY, avgZ]
      }
    })
    
    return { normalizedData, colorScale, clusterCentroids }
  }, [data])
  
  const handleSelectVerse = (verse: VerseData) => {
    setSelectedVerse(verse)
    onSelectVerse(verse)
  }
  
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Render individual points */}
      {normalizedData.map((verse, index) => (
        <Point
          key={`verse-${verse.surah_id}-${verse.ayah}-${index}`}
          position={[verse.normalizedX, verse.normalizedY, verse.normalizedZ]}
          color={colorScale(verse.core_meaning)}
          verse={verse}
          onSelect={handleSelectVerse}
          isSelected={selectedVerse?.id === verse.id}
        />
      ))}
      
      {/* Render cluster labels based on core meaning. 
          Assume ClusterLabel hides itself when the camera is too close (using the hideDistance prop). */}
      {Object.entries(clusterCentroids).map(([core, position]) => (
        <ClusterLabel
          key={`cluster-${core}`}
          position={position}
          text={core || 'Cluster'}
          color={colorScale(core)}
          hideDistance={8} // Adjust threshold as needed.
        />
      ))}
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        maxDistance={20}
      />
      
      <gridHelper args={[10, 20]} position={[0, -5, 0]} />
    </Canvas>
  )
}

export default QuranVisualization
