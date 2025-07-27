import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

type ClusterLabelProps = {
  position: [number, number, number]
  text: string
  color: string
}

const ClusterLabel = ({ position, text, color }: ClusterLabelProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (!groupRef.current) return
    // Keep the label facing the camera for readability
    groupRef.current.quaternion.copy(camera.quaternion)
  })

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
