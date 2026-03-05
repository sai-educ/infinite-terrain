import { useState, useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { sharedNoise2D } from './utils/worldNoise.js'
import * as THREE from 'three'

import TerrainChunk from './TerrainChunk.jsx'
import Trees from './Trees.jsx'
import useTerrainMaterial from '../materials/TerrainMaterial.jsx'
import useGrassMaterial from '../materials/GrassMaterial.jsx'
import useStonesMaterial from '../materials/StonesMaterial.jsx'
import useTreeMaterial from '../materials/TreeMaterial.jsx'
import useWindMaterial from '../materials/WindMaterial.jsx'
import useStore from '../stores/useStore.jsx'

import noiseTextureUrl from '../assets/textures/noiseTexture.png'
import alphaLeavesUrl from '../assets/textures/alpha_leaves.png'

const START_CIRCLE_RADIUS = 100.0
const VISIBLE_CHUNK_RADIUS = 6 // 13x13 chunks (~19x the old 3x3 visible area)
const MAX_REVEAL_RADIUS_FACTOR = VISIBLE_CHUNK_RADIUS + 0.3

export default function Terrain() {
    const [activeChunks, setActiveChunks] = useState([])

    const currentChunk = useRef({ x: 0, z: 0, size: 0 })
    const circleRadiusRef = useRef(START_CIRCLE_RADIUS)
    const circleCenterRef = useRef(new THREE.Vector3(0, 0, 0))

    const chunkSize = useStore((s) => s.terrainParameters.chunkSize)
    const terrainScale = useStore((s) => s.terrainParameters.scale)
    const terrainAmplitude = useStore((s) => s.terrainParameters.amplitude)
    const landElevation = useStore((s) => s.oceanParameters.landElevation)
    const borderCircleRadius = useStore((s) => s.borderParameters.circleRadiusFactor)
    const windParameters = useStore((s) => s.windParameters)
    const windLineParameters = useStore((s) => s.windLineParameters)
    const windLineWidth = windLineParameters.width
    const windDirection = windParameters.direction
    const stoneParameters = useStore((s) => s.stoneParameters)
    const treesEnabled = useStore((s) => s.generalParameters.trees)
    const windEnabled = useStore((s) => s.generalParameters.wind)

    const noise2D = sharedNoise2D

    // Textures
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
    const alphaMap = useTexture(alphaLeavesUrl)

    const terrainMaterial = useTerrainMaterial({
        chunkSize,
        initialCircleRadius: START_CIRCLE_RADIUS,
        noiseTexture,
    })

    const grassMaterial = useGrassMaterial({
        chunkSize,
        initialCircleRadius: START_CIRCLE_RADIUS,
        noiseTexture,
    })

    const stoneMaterial = useStonesMaterial({
        chunkSize,
        initialCircleRadius: START_CIRCLE_RADIUS,
        noiseTexture,
    })

    // Shared stone geometry
    const stoneGeometry = useMemo(() => {
        return new THREE.IcosahedronGeometry(1, 0)
    }, [])

    const treeMaterial = useTreeMaterial({
        chunkSize,
        initialCircleRadius: START_CIRCLE_RADIUS,
        noiseTexture,
        alphaMap,
    })

    const windMaterial = useWindMaterial({
        chunkSize,
        initialCircleRadius: START_CIRCLE_RADIUS,
        noiseTexture,
    })

    const windBaseGeometry = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(10, windLineWidth, 20, 1)
        return geometry
    }, [windLineWidth])

    useEffect(() => {
        return () => {
            windBaseGeometry.dispose()
        }
    }, [windBaseGeometry])

    const rigidBodyMaterial = useMemo(() => {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        mat.visible = false
        return mat
    }, [])

    const setCircleRadius = (value) => {
        circleRadiusRef.current = value
        terrainMaterial.uniforms.uCircleRadiusFactor.value = value
        grassMaterial.uniforms.uCircleRadiusFactor.value = value
        stoneMaterial.uniforms.uCircleRadiusFactor.value = value
        if (treeMaterial.uniforms?.uCircleRadiusFactor) {
            treeMaterial.uniforms.uCircleRadiusFactor.value = value
        }
        windMaterial.uniforms.uCircleRadiusFactor.value = value
    }

    useEffect(() => {
        return () => {
            stoneGeometry.dispose()
            rigidBodyMaterial.dispose()
            noiseTexture.dispose()
            alphaMap.dispose()
        }
    }, [stoneGeometry, rigidBodyMaterial, noiseTexture, alphaMap])

    useEffect(() => {
        setCircleRadius(THREE.MathUtils.clamp(borderCircleRadius, 1.0, MAX_REVEAL_RADIUS_FACTOR))
    }, [borderCircleRadius])

    useFrame(({ clock }) => {
        const state = useStore.getState()
        const circleCenter = circleCenterRef.current
        circleCenter.set(0, landElevation, 0)
        circleCenter.y = landElevation

        // Update terrain material uniforms
        terrainMaterial.uniforms.uCircleCenter.value.copy(circleCenter)

        // Update grass material uniforms
        grassMaterial.uniforms.uTime.value = clock.elapsedTime
        grassMaterial.uniforms.uTrailTexture.value = state.trailTexture
        grassMaterial.uniforms.uBallPosition.value.copy(state.ballPosition)
        grassMaterial.uniforms.uCircleCenter.value.copy(circleCenter)

        // Update stones uniforms (no rerenders required)
        stoneMaterial.uniforms.uCircleCenter.value.copy(circleCenter)

        // Update tree material uniforms
        if (treesEnabled && treeMaterial.uniforms) {
            treeMaterial.uniforms.uTime.value = clock.elapsedTime
            treeMaterial.uniforms.uCircleCenter.value.copy(circleCenter)
            treeMaterial.uniforms.uBallPosition.value.copy(state.ballPosition)
        }

        // Update wind uniforms
        windMaterial.uniforms.uTime.value = clock.elapsedTime
        windMaterial.uniforms.uCircleCenter.value.copy(circleCenter)

        // Chunk management
        const safeChunkSize = Math.max(0.0001, chunkSize)
        const chunkX = 0
        const chunkZ = 0

        if (chunkX !== currentChunk.current.x || chunkZ !== currentChunk.current.z || currentChunk.current.size !== safeChunkSize || activeChunks.length === 0) {
            currentChunk.current = { x: chunkX, z: chunkZ, size: safeChunkSize }

            const newChunks = []
            for (let x = -VISIBLE_CHUNK_RADIUS; x <= VISIBLE_CHUNK_RADIUS; x++) {
                for (let z = -VISIBLE_CHUNK_RADIUS; z <= VISIBLE_CHUNK_RADIUS; z++) {
                    newChunks.push({
                        x: chunkX + x,
                        z: chunkZ + z,
                        key: `${chunkX + x},${chunkZ + z}`,
                    })
                }
            }
            setActiveChunks(newChunks)
        }
    })

    return (
        <group position={[0, landElevation, 0]}>
            {activeChunks.map((chunk) => (
                <TerrainChunk
                    key={chunk.key}
                    x={chunk.x}
                    z={chunk.z}
                    size={chunkSize}
                    noise2D={noise2D}
                    noiseTexture={noiseTexture}
                    terrainMaterial={terrainMaterial}
                    grassMaterial={grassMaterial}
                    stoneMaterial={stoneMaterial}
                    stoneGeometry={stoneGeometry}
                    windBaseGeometry={windBaseGeometry}
                    windMaterial={windMaterial}
                    windLineParameters={windLineParameters}
                    windDirection={windDirection}
                    windEnabled={windEnabled}
                />
            ))}
            {treesEnabled && (
                <Trees
                    activeChunks={activeChunks}
                    chunkSize={chunkSize}
                    noise2D={noise2D}
                    stoneParameters={stoneParameters}
                    terrainScale={terrainScale}
                    terrainAmplitude={terrainAmplitude}
                    treeMaterial={treeMaterial}
                    rigidBodyMaterial={rigidBodyMaterial}
                />
            )}
        </group>
    )
}
