import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRef, useState } from 'react'
import * as THREE from 'three'

type ClusterLabelProps = {
  position: [number, number, number]
  text: string
  color: string
  hideDistance?: number // optional threshold for hiding label
}

const ClusterLabel = ({
  position,
  text,
  color,
  hideDistance = 5
}: ClusterLabelProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()
  const [visible, setVisible] = useState(true)

  useFrame(() => {
    if (!groupRef.current) return
    // Calculate distance from camera to the label's position
    const dist = camera.position.distanceTo(new THREE.Vector3(...position))
    // Hide if camera is closer than hideDistance
    setVisible(dist > hideDistance)
  })

  // If not visible, return null to hide the label
  if (!visible) return null

  return (
    <group ref={groupRef} position={position}>
      {/* Optional colored sprite behind the text */}
      <sprite scale={[1, 0.5, 1]} position={[0, 0.1, 0]}>
        <spriteMaterial transparent opacity={0.7} color={color} />
      </sprite>
      <Html distanceFactor={10}>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
          transform: 'translate3d(-50%, -50%, 0)'
        }}>
          {text}
        </div>
      </Html>
    </group>
  )
}

export default ClusterLabel
