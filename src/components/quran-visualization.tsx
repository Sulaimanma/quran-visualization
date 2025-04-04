'use client'

import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { interpolateRainbow } from 'd3-scale-chromatic'
import type { VerseData } from '@/app/page'

type PointProps = {
  position: [number, number, number]
  color: string
  verse: VerseData
  onSelect: (verse: VerseData) => void
  isSelected: boolean
}

// Individual point component
const Point = ({ position, color, verse, onSelect, isSelected }: PointProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Only animate selected points, not hovered ones
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
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => onSelect(verse)}
    >
      <sphereGeometry args={[0.015, 8, 8]} /> {/* Reduced complexity */}
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

// Main visualization component
const QuranVisualization = ({ data, onSelectVerse }: PointCloudProps) => {
  const [selectedVerse, setSelectedVerse] = useState<VerseData | null>(null)
  
  // Normalize data for visualization
  const { normalizedData, colorScale } = useMemo(() => {
    if (!data.length) return { 
      normalizedData: [], 
      colorScale: () => '#ffffff'
    }

    let minX = Infinity, minY = Infinity, minZ = Infinity
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
    
    // Find bounds
    data.forEach(point => {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      minZ = Math.min(minZ, point.z)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
      maxZ = Math.max(maxZ, point.z)
    })
    
    // Create a normalized copy with increased spacing between points
    const spreadFactor = 4; // Increase this to spread points more
    const normalizedData = data.map(point => ({
      ...point,
      normalizedX: ((point.x - minX) / (maxX - minX) * 2 - 1) * spreadFactor,
      normalizedY: ((point.y - minY) / (maxY - minY) * 2 - 1) * spreadFactor,
      normalizedZ: ((point.z - minZ) / (maxZ - minZ) * 2 - 1) * spreadFactor,
    }))
    
    // Get clusters for coloring
    const clusters = Array.from(new Set(data.map(point => point.cluster)))
    const numClusters = clusters.length
    
    // Create color scale based on semantic similarity (clusters)
    const colorScale = (cluster: number) => {
      const normalizedValue = clusters.indexOf(cluster) / (numClusters - 1)
      return interpolateRainbow(normalizedValue)
    }
    
    return { 
      normalizedData,
      colorScale
    }
  }, [data])
  
  const handleSelectVerse = (verse: VerseData) => {
    setSelectedVerse(verse)
    onSelectVerse(verse)
  }
  
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}> {/* Adjusted camera position for better view */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {normalizedData.map((verse, index) => (
        <Point
          key={`verse-${verse.surah_id}-${verse.ayah}-${index}`}
          position={[verse.normalizedX, verse.normalizedY, verse.normalizedZ]}
          color={colorScale(verse.cluster)}
          verse={verse}
          onSelect={handleSelectVerse}
          isSelected={selectedVerse?.id === verse.id}
        />
      ))}
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        maxDistance={20} // Limit how far users can zoom out
      />
      
      {/* Grid to help with orientation */}
      <gridHelper args={[10, 20]} position={[0, -5, 0]} />
    </Canvas>
  )
}

export default QuranVisualization
