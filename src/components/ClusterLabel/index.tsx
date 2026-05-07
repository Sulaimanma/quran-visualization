import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

type ClusterLabelProps = {
  position: [number, number, number]
  text: string
  color: string
  subtitle?: string
  onClick?: () => void
  active?: boolean
}

const ClusterLabel = ({ position, text, color, subtitle, onClick, active = false }: ClusterLabelProps) => {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  useFrame(() => {
    if (!groupRef.current) return
    groupRef.current.quaternion.copy(camera.quaternion)
  })

  return (
    <group ref={groupRef} position={position} onClick={onClick}>
      <sprite scale={active ? [2.1, 1.2, 1.6] : [1.8, 1, 1.4]} position={[0, 0.1, 0]}>
        <spriteMaterial transparent opacity={active ? 0.9 : 0.75} color={color} />
      </sprite>
      <Html distanceFactor={9}>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '6px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          pointerEvents: 'none',
          transform: 'translate3d(-50%, -50%, 0)',
          border: active ? '1px solid white' : undefined,
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {subtitle ? <div style={{ opacity: 0.8, fontSize: '10px', marginTop: 2 }}>{subtitle}</div> : null}
        </div>
      </Html>
    </group>
  )
}

export default ClusterLabel
