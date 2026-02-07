import { useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

import windLineVertexShader from '../shaders/windLine/vertex.glsl'
import windLineFragmentShader from '../shaders/windLine/fragment.glsl'

import useStore from '../stores/useStore.jsx'
import noiseTextureUrl from '/textures/noiseTexture.png'

export default function WindLine({ position, scale, timeOffset = 0 }) {
    const windDirection = useStore((state) => state.windParameters.direction)

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(10, 0.15, 200, 1)
        geo.rotateX(-Math.PI / 2)
        const posAttr = geo.attributes.position

        const timeOffsets = new Float32Array(posAttr.count).fill(timeOffset)
        geo.setAttribute('aTimeOffset', new THREE.BufferAttribute(timeOffsets, 1))

        return geo
    }, [timeOffset])

    useEffect(() => {
        return () => {
            geometry.dispose()
        }
    }, [geometry])

    const noiseTexture = useTexture(
        noiseTextureUrl,
        (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.RepeatWrapping
            texture.minFilter = THREE.LinearFilter
            texture.magFilter = THREE.LinearFilter
            return texture
        },
        [noiseTextureUrl]
    )

    const material = useMemo(() => {
        const material = new THREE.ShaderMaterial({
            vertexShader: windLineVertexShader,
            fragmentShader: windLineFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uTimeMultiplier: { value: 0.1 },
                uAlphaMultiplier: { value: 0.5 },
                uUVmin: { value: -3.5 },
                uUVmax: { value: 4.5 },
                uNoiseTexture: { value: null },
                uNoiseScale: { value: 1.0 },
                uNoiseStrengthY: { value: 1.0 },
                uNoiseStrengthZ: { value: 1.0 },
                uNoiseSpeed: { value: 1.0 },
                uNoiseDirection: { value: new THREE.Vector2(1, 0) },
            },
            transparent: true,
            side: THREE.DoubleSide,
            // wireframe: true,
        })
        return material
    }, [])

    useEffect(() => {
        const u = material.uniforms
        u.uNoiseTexture.value = noiseTexture
        u.uNoiseScale.value = 1.0
        u.uNoiseStrengthY.value = 1.0
        u.uNoiseStrengthZ.value = 1.0
        u.uNoiseSpeed.value = 1.0
        u.uNoiseDirection.value.set(Math.cos(windDirection ?? 0), Math.sin(windDirection ?? 0))
    }, [material, noiseTexture, windDirection])

    useFrame(({ clock }) => {
        material.uniforms.uTime.value = clock.elapsedTime
    })

    return (
        <group position={position} rotation={[0, Math.PI / 2 + windDirection, 0]} scale={scale}>
            <mesh geometry={geometry} material={material} />
        </group>
    )
}
