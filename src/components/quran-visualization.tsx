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
  activeCluster: string | null
}

const Point = ({ position, color, verse, onSelect, isSelected, activeCluster }: PointProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const isHighlighted = activeCluster ? verse.core_meaning.trim() === activeCluster : false

  useFrame(() => {
    if (!meshRef.current) return
    const highlightScale = activeCluster ? 1.6 : 1.3
    const targetScale = isSelected || isHighlighted ? highlightScale : 1
    meshRef.current.scale.x = THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1)
    meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, targetScale, 0.1)
    meshRef.current.scale.z = THREE.MathUtils.lerp(meshRef.current.scale.z, targetScale, 0.1)
  })

  const baseSize = activeCluster ? 0.02 : 0.012

  return (
    <mesh ref={meshRef} position={position} onClick={() => onSelect(verse)}>
      <sphereGeometry args={[baseSize, 10, 10]} />
      <meshStandardMaterial
        color={color}
        emissive={isSelected || isHighlighted ? 'white' : color}
        emissiveIntensity={isSelected ? 0.5 : isHighlighted ? 0.3 : 0.08}
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
  const [activeCluster, setActiveCluster] = useState<string | null>(null)

  const { normalizedData, colorScale, clusterCentroids, clusterHexMap, uniqueCores } = useMemo(() => {
    if (!data.length) {
      return {
        normalizedData: [],
        colorScale: () => '#ffffff',
        clusterCentroids: {},
        clusterHexMap: {},
        uniqueCores: [],
      }
    }

    let minX = Infinity; let minY = Infinity; let minZ = Infinity
    let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity
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

    const uniqueCores = Array.from(new Set(normalizedData.map(p => p.core_meaning.trim()))).sort()
    const numCores = uniqueCores.length
    const colorScale = (core: string) => {
      const index = uniqueCores.indexOf(core.trim())
      if (index === -1 || numCores === 1) return '#ffffff'
      return interpolateRainbow(index / (numCores - 1))
    }

    const clusterCentroids: Record<string, [number, number, number]> = {}
    uniqueCores.forEach(core => {
      const clusterPoints = normalizedData.filter(p => p.core_meaning.trim() === core)
      if (!clusterPoints.length) return
      const avgX = clusterPoints.reduce((sum, p) => sum + p.normalizedX, 0) / clusterPoints.length
      const avgY = clusterPoints.reduce((sum, p) => sum + p.normalizedY, 0) / clusterPoints.length
      const avgZ = clusterPoints.reduce((sum, p) => sum + p.normalizedZ, 0) / clusterPoints.length
      clusterCentroids[core] = [avgX, avgY, avgZ]
    })

    const clusterHexMap: Record<string, [number, number, number]> = {}
    const columns = Math.ceil(Math.sqrt(uniqueCores.length))
    const hexRadius = 1.4
    uniqueCores.forEach((core, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      const x = (col - columns / 2) * (hexRadius * 1.75) + (row % 2 === 0 ? 0 : hexRadius * 0.85)
      const y = (Math.ceil(uniqueCores.length / columns) / 2 - row) * (hexRadius * 1.5)
      clusterHexMap[core] = [x, y, 0]
    })

    return { normalizedData, colorScale, clusterCentroids, clusterHexMap, uniqueCores }
  }, [data])

  const displayedData = useMemo(() => {
    return normalizedData.map(verse => {
      const core = verse.core_meaning.trim()
      if (activeCluster) {
        return verse
      }
      const hex = clusterHexMap[core] ?? [0, 0, 0]
      return {
        ...verse,
        normalizedX: hex[0] + verse.normalizedX * 0.09,
        normalizedY: hex[1] + verse.normalizedY * 0.09,
        normalizedZ: verse.normalizedZ * 0.03,
      }
    })
  }, [normalizedData, activeCluster, clusterHexMap])

  const handleSelectVerse = (verse: VerseData) => {
    setSelectedVerse(verse)
    onSelectVerse(verse)
  }

  return (
    <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
      <ambientLight intensity={0.55} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {(activeCluster ? displayedData.filter(v => v.core_meaning.trim() === activeCluster) : displayedData).map((verse, index) => (
        <Point
          key={`verse-${verse.surah_id}-${verse.ayah}-${index}`}
          position={[verse.normalizedX, verse.normalizedY, verse.normalizedZ]}
          color={colorScale(verse.core_meaning)}
          verse={verse}
          onSelect={handleSelectVerse}
          isSelected={selectedVerse?.id === verse.id}
          activeCluster={activeCluster}
        />
      ))}

      {(activeCluster ? [activeCluster] : uniqueCores).map((core) => (
        <ClusterLabel
          key={`cluster-${core}`}
          position={activeCluster ? clusterCentroids[core] : clusterHexMap[core]}
          text={core || 'Cluster'}
          color={colorScale(core)}
          subtitle={activeCluster ? 'Click to return to honeycomb' : 'Click to focus'}
          onClick={() => setActiveCluster(c => (c === core ? null : core))}
          active={activeCluster === core}
        />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} rotateSpeed={0.45} zoomSpeed={0.7} maxDistance={24} />
      <gridHelper args={[16, 24]} position={[0, -6, 0]} />
    </Canvas>
  )
}

export default QuranVisualization
