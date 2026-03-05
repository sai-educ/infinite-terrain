import { useEffect, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { TextureLoader } from 'three'
import { Water } from 'three/examples/jsm/objects/Water.js'

import useStore from '../stores/useStore.jsx'
import waterNormalsUrl from '../assets/textures/waterNormals.jpg'

const DEFAULT_SUN_DIRECTION = new THREE.Vector3(0.35, 1.0, 0.25).normalize()

export default function Ocean() {
    const oceanParameters = useStore((state) => state.oceanParameters)
    const waterNormals = useLoader(TextureLoader, waterNormalsUrl)

    const water = useMemo(() => {
        waterNormals.wrapS = THREE.RepeatWrapping
        waterNormals.wrapT = THREE.RepeatWrapping

        const geometry = new THREE.PlaneGeometry(1, 1)
        const mesh = new Water(geometry, {
            textureWidth: 1024,
            textureHeight: 1024,
            waterNormals,
            sunDirection: DEFAULT_SUN_DIRECTION.clone(),
            sunColor: oceanParameters.sunColor,
            waterColor: oceanParameters.waterColor,
            distortionScale: oceanParameters.distortionScale,
            alpha: oceanParameters.alpha,
            fog: false,
        })
        mesh.rotation.x = -Math.PI / 2
        mesh.frustumCulled = false
        return mesh
    }, [waterNormals])

    useEffect(() => {
        const uniforms = water.material.uniforms
        water.visible = oceanParameters.enabled
        water.position.set(0, oceanParameters.level, 0)
        water.scale.set(oceanParameters.size, oceanParameters.size, 1)
        uniforms.size.value = oceanParameters.waveSize
        uniforms.distortionScale.value = oceanParameters.distortionScale
        uniforms.alpha.value = oceanParameters.alpha
        uniforms.waterColor.value.set(oceanParameters.waterColor)
        uniforms.sunColor.value.set(oceanParameters.sunColor)
        uniforms.sunDirection.value.copy(DEFAULT_SUN_DIRECTION)
    }, [water, oceanParameters])

    useFrame((_, delta) => {
        water.material.uniforms.time.value += delta * oceanParameters.waveSpeed
    })

    useEffect(() => {
        return () => {
            water.geometry.dispose()
            water.material.dispose()
        }
    }, [water])

    if (!oceanParameters.enabled) return null

    return <primitive object={water} />
}
