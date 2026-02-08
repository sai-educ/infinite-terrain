import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

import bushesVertexShader from '../../shaders/leaves/vertex.glsl'
import bushesFragmentShader from '../../shaders/leaves/fragment.glsl'
import useStore from '../../stores/useStore.jsx'

export default function useLeavesMaterial({
    chunkSize,
    initialCircleRadius,
    noiseTexture,
    alphaMap,
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
            uniforms: {
                uTime: { value: 0 },
                uWiggleStrength: { value: treeParameters.bushWiggleStrength },
                uWiggleSpeed: { value: treeParameters.bushWiggleSpeed },
                uWorldNoiseScale: { value: treeParameters.bushWorldNoiseScale },
                uUvWiggleScale: { value: treeParameters.bushUvWiggleScale },
                uNoiseTexture: { value: noiseTexture },
                uNoiseMix: { value: treeParameters.bushNoiseMix },

                uFresnelPower: { value: treeParameters.bushFresnelPower },
                uFresnelStrength: { value: treeParameters.bushFresnelStrength },
                uFresnelColor: { value: new THREE.Color(treeParameters.bushFresnelColor) },

                uCircleCenter: { value: new THREE.Vector3() },
                uChunkSize: { value: chunkSize },
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
            vertexShader: bushesVertexShader,
            fragmentShader: bushesFragmentShader,
            color: new THREE.Color(treeParameters.leavesColor),
            alphaMap: alphaMap,
            transparent: false,
            side: THREE.DoubleSide,
            depthWrite: true,
            alphaToCoverage: false,
            alphaTest: treeParameters.bushAlphaTest,
            roughness: 1.0,
            metalness: 0.0,
        })
    }, [])

    useEffect(() => {
        const u = material.uniforms
        u.uWiggleStrength.value = treeParameters.bushWiggleStrength
        u.uWiggleSpeed.value = treeParameters.bushWiggleSpeed
        u.uWorldNoiseScale.value = treeParameters.bushWorldNoiseScale
        u.uUvWiggleScale.value = treeParameters.bushUvWiggleScale
        u.uNoiseTexture.value = noiseTexture
        u.uNoiseMix.value = treeParameters.bushNoiseMix

        u.uFresnelPower.value = treeParameters.bushFresnelPower
        u.uFresnelStrength.value = treeParameters.bushFresnelStrength
        u.uFresnelColor.value.set(treeParameters.bushFresnelColor)

        u.uChunkSize.value = chunkSize
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

        material.color.set(treeParameters.leavesColor)

        if (material.alphaMap !== alphaMap) {
            material.alphaMap = alphaMap
            material.needsUpdate = true
        }
        if (material.alphaTest !== treeParameters.bushAlphaTest) {
            material.alphaTest = treeParameters.bushAlphaTest
            material.needsUpdate = true
        }
    }, [
        material,
        treeParameters,
        chunkSize,
        noiseTexture,
        alphaMap,
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
