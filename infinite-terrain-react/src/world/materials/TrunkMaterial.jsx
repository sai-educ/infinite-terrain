import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

import trunkVertexShader from '../../shaders/trunk/vertex.glsl'
import trunkFragmentShader from '../../shaders/trunk/fragment.glsl'
import useStore from '../../stores/useStore.jsx'

export default function useTrunkMaterial({
    chunkSize,
    initialCircleRadius,
    noiseTexture,
}) {
    const treeParameters = useStore((s) => s.treeParameters)
    const ballFadeParameters = useStore((s) => s.ballFadeParameters)
    const borderTreesMultiplier = useStore((s) => s.borderParameters.borderTreesMultiplier)
    const borderNoiseStrength = useStore((s) => s.borderParameters.noiseStrength)
    const borderNoiseScale = useStore((s) => s.borderParameters.noiseScale)
    const borderGrassFadeOffset = useStore((s) => s.borderParameters.grassFadeOffset)
    const pixelSize = useStore((s) => s.ditheringParameters.pixelSize)
    const ditherModeValue = useStore((s) => (s.ditheringParameters.ditherMode === 'Bayer' ? 1 : 0))

    const material = useMemo(() => {
        return new CustomShaderMaterial({
            baseMaterial: THREE.MeshStandardMaterial,
            vertexShader: trunkVertexShader,
            fragmentShader: trunkFragmentShader,
            uniforms: {
                uTrunkColorA: { value: new THREE.Color(treeParameters.trunkColorA ?? '#ffffff') },
                uTrunkColorB: { value: new THREE.Color(treeParameters.trunkColorB ?? '#000000') },
                uCircleCenter: { value: new THREE.Vector3() },
                uChunkSize: { value: chunkSize },
                uNoiseTexture: { value: noiseTexture },
                uNoiseStrength: { value: borderNoiseStrength },
                uNoiseScale: { value: borderNoiseScale },
                uCircleRadiusFactor: { value: initialCircleRadius },
                uGrassFadeOffset: { value: borderGrassFadeOffset },
                uBorderTreesMultiplier: { value: borderTreesMultiplier },
                uBallPosition: { value: new THREE.Vector3() },
                uBallFadeRadius: { value: ballFadeParameters.radius },
                uBallFadeWidth: { value: ballFadeParameters.width },
                uBallNoiseScale: { value: ballFadeParameters.noiseScale },
                uBallNoiseStrength: { value: ballFadeParameters.noiseStrength },
                uBallFadeMax: { value: ballFadeParameters.maxFade },
                uPixelSize: { value: pixelSize },
                uDitherMode: { value: ditherModeValue }, // 0: Diamond, 1: Bayer
            },
            roughness: 1.0,
            metalness: 0.0,
        })
    }, [])

    useEffect(() => {
        const u = material.uniforms
        u.uTrunkColorA.value.set(treeParameters.trunkColorA ?? '#ffffff')
        u.uTrunkColorB.value.set(treeParameters.trunkColorB ?? '#000000')
        u.uChunkSize.value = chunkSize
        u.uNoiseTexture.value = noiseTexture
        u.uNoiseStrength.value = borderNoiseStrength
        u.uNoiseScale.value = borderNoiseScale
        u.uGrassFadeOffset.value = borderGrassFadeOffset
        u.uBorderTreesMultiplier.value = borderTreesMultiplier
        u.uBallFadeRadius.value = ballFadeParameters.radius
        u.uBallFadeWidth.value = ballFadeParameters.width
        u.uBallNoiseScale.value = ballFadeParameters.noiseScale
        u.uBallNoiseStrength.value = ballFadeParameters.noiseStrength
        u.uBallFadeMax.value = ballFadeParameters.maxFade
        u.uPixelSize.value = pixelSize
        u.uDitherMode.value = ditherModeValue
    }, [
        material,
        treeParameters.trunkColorA,
        treeParameters.trunkColorB,
        chunkSize,
        noiseTexture,
        borderNoiseStrength,
        borderNoiseScale,
        borderGrassFadeOffset,
        borderTreesMultiplier,
        ballFadeParameters,
        pixelSize,
        ditherModeValue,
    ])

    useEffect(() => {
        return () => {
            material.dispose()
        }
    }, [material])

    return material
}
