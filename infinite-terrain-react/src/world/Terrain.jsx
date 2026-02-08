import { useState, useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture, useGLTF } from '@react-three/drei'
import { sharedNoise2D } from './utils/worldNoise.js'
import { gsap } from 'gsap'
import * as THREE from 'three'

import TerrainChunk from './TerrainChunk.jsx'
import { Tree } from './Tree.jsx'
import Wind from './Wind.jsx'
import useTerrainMaterial from './materials/TerrainMaterial.jsx'
import useGrassMaterial from './materials/GrassMaterial.jsx'
import useStonesMaterial from './materials/StonesMaterial.jsx'
import useLeavesMaterial from './materials/LeavesMaterial.jsx'
import useTrunkMaterial from './materials/TrunkMaterial.jsx'
import useStore from '../stores/useStore.jsx'
import usePhases, { PHASES } from '../stores/usePhases.jsx'
import { generateChunkData } from './utils/chunkUtils.js'

import noiseTextureUrl from '/textures/noiseTexture.png'
import alphaLeavesUrl from '../assets/textures/alpha_leaves.png'
import treeUrl from '../assets/models/tree.glb'

const TREE_POOL_SIZE = 18
const START_CIRCLE_RADIUS = 0.07
const START_RADIUS_DELAY = 1.1

export default function Terrain() {
    const [activeChunks, setActiveChunks] = useState([])

    const currentChunk = useRef({ x: 0, z: 0 })
    const radiusAnimationRef = useRef(null)
    const prevPhaseRef = useRef(PHASES.loading)
    const circleRadiusRef = useRef(START_CIRCLE_RADIUS)

    const phase = usePhases((s) => s.phase)

    const chunkSize = useStore((s) => s.terrainParameters.chunkSize)
    const terrainScale = useStore((s) => s.terrainParameters.scale)
    const terrainAmplitude = useStore((s) => s.terrainParameters.amplitude)
    const borderCircleRadius = useStore((s) => s.borderParameters.circleRadiusFactor)
    const stoneParameters = useStore((s) => s.stoneParameters)

    const noise2D = sharedNoise2D

    const treePoolStateRef = useRef({
        slots: Array.from({ length: TREE_POOL_SIZE }, () => ({ id: null, data: null })),
        map: new Map(),
    })

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

    // Tree model
    const treeModel = useGLTF(treeUrl)

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

    const leavesMaterial = useLeavesMaterial({
        chunkSize,
        initialCircleRadius: START_CIRCLE_RADIUS,
        noiseTexture,
        alphaMap,
    })

    const trunkMaterial = useTrunkMaterial({
        chunkSize,
        initialCircleRadius: START_CIRCLE_RADIUS,
        noiseTexture,
    })

    const rigidBodyMaterial = useMemo(() => {
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff })
        mat.visible = false
        return mat
    }, [])

    const applyCircleRadius = (value) => {
        terrainMaterial.uniforms.uCircleRadiusFactor.value = value
        grassMaterial.uniforms.uCircleRadiusFactor.value = value
        stoneMaterial.uniforms.uCircleRadiusFactor.value = value
        if (leavesMaterial?.uniforms?.uCircleRadiusFactor) {
            leavesMaterial.uniforms.uCircleRadiusFactor.value = value
        }
        if (trunkMaterial?.uniforms?.uCircleRadiusFactor) {
            trunkMaterial.uniforms.uCircleRadiusFactor.value = value
        }
    }

    const setCircleRadius = (value) => {
        circleRadiusRef.current = value
        applyCircleRadius(value)
    }

    // Cleanup materials and shared assets on unmount
    useEffect(() => {
        return () => {
            stoneGeometry.dispose()
            rigidBodyMaterial.dispose()
            // Dispose shared textures when the entire terrain is gone
            noiseTexture.dispose()
            alphaMap.dispose()
        }
    }, [stoneGeometry, rigidBodyMaterial, noiseTexture, alphaMap])

    useEffect(() => {
        if (phase === PHASES.start) return
        if (radiusAnimationRef.current) return
        setCircleRadius(START_CIRCLE_RADIUS)
    }, [phase])

    useEffect(() => {
        if (phase !== PHASES.start) return
        if (radiusAnimationRef.current) return
        if (prevPhaseRef.current !== PHASES.start) return
        setCircleRadius(borderCircleRadius)
    }, [phase, borderCircleRadius])

    // Handle radius animation
    const handleRadiusAnimation = () => {
        const targetRadius = borderCircleRadius
        const startRadius = START_CIRCLE_RADIUS

        // Kill previous animation if it exists
        if (radiusAnimationRef.current) {
            radiusAnimationRef.current.kill()
            radiusAnimationRef.current = null
        }

        // Set initial radius
        setCircleRadius(startRadius)

        // Create animation object for GSAP to animate
        const radiusObj = { value: startRadius }

        // Animate radius from 0.2 to target value
        radiusAnimationRef.current = gsap.to(radiusObj, {
            value: targetRadius,
            duration: 2.0,
            delay: START_RADIUS_DELAY,
            ease: 'power2.out',
            onUpdate: () => {
                setCircleRadius(radiusObj.value)
            },
            onComplete: () => {
                radiusAnimationRef.current = null
            },
        })
    }

    // Listen for game start trigger from Loader
    useEffect(() => {
        if (phase === PHASES.start && prevPhaseRef.current !== PHASES.start) {
            handleRadiusAnimation()
        }
        prevPhaseRef.current = phase
    }, [phase, borderCircleRadius])

    // Cleanup animations on unmount
    useEffect(() => {
        return () => {
            if (radiusAnimationRef.current) {
                radiusAnimationRef.current.kill()
                radiusAnimationRef.current = null
            }
        }
    }, [])

    useFrame(({ clock }) => {
        const state = useStore.getState()
        // Update terrain material uniforms
        terrainMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)

        // Update grass material uniforms
        grassMaterial.uniforms.uTime.value = clock.elapsedTime
        grassMaterial.uniforms.uTrailTexture.value = state.trailTexture
        grassMaterial.uniforms.uBallPosition.value.copy(state.ballPosition)
        grassMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)

        // Update stones uniforms (no rerenders required)
        stoneMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)

        // Update tree leaves material uniforms
        if (leavesMaterial?.uniforms?.uTime) {
            leavesMaterial.uniforms.uTime.value = clock.elapsedTime
        }
        if (leavesMaterial?.uniforms?.uCircleCenter) {
            leavesMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)
        }
        if (leavesMaterial?.uniforms?.uBallPosition) {
            leavesMaterial.uniforms.uBallPosition.value.copy(state.ballPosition)
        }
        if (trunkMaterial?.uniforms?.uCircleCenter) {
            trunkMaterial.uniforms.uCircleCenter.value.copy(state.smoothedCircleCenter)
        }
        if (trunkMaterial?.uniforms?.uBallPosition) {
            trunkMaterial.uniforms.uBallPosition.value.copy(state.ballPosition)
        }

        // Chunk management
        const ballPosition = state.ballPosition
        const safeChunkSize = Math.max(0.0001, chunkSize)
        const chunkX = Math.round(ballPosition.x / safeChunkSize)
        const chunkZ = Math.round(ballPosition.z / safeChunkSize)

        if (chunkX !== currentChunk.current.x || chunkZ !== currentChunk.current.z || currentChunk.current.size !== safeChunkSize || activeChunks.length === 0) {
            currentChunk.current = { x: chunkX, z: chunkZ, size: safeChunkSize }

            const newChunks = []
            for (let x = -1; x <= 1; x++) {
                for (let z = -1; z <= 1; z++) {
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

    const treeTargets = useMemo(() => {
        if (!activeChunks || activeChunks.length === 0) return []

        const targets = []
        for (const chunk of activeChunks) {
            const { treeInstances } = generateChunkData(chunk.x, chunk.z, chunkSize, noise2D, stoneParameters, { scale: terrainScale, amplitude: terrainAmplitude })
            const originX = chunk.x * chunkSize
            const originZ = chunk.z * chunkSize

            for (const t of treeInstances) {
                targets.push({
                    id: t.id,
                    seed: t.seed,
                    position: [t.position[0] + originX, t.position[1], t.position[2] + originZ],
                    rotation: t.rotation,
                    scale: t.scale,
                })
            }
        }

        return targets
    }, [activeChunks, chunkSize, noise2D, stoneParameters, terrainScale, terrainAmplitude])

    const treePoolSlots = useMemo(() => {
        const pool = treePoolStateRef.current
        const nextIds = new Set(treeTargets.map((t) => t.id))

        for (let i = 0; i < pool.slots.length; i++) {
            const slot = pool.slots[i]
            if (slot.id && !nextIds.has(slot.id)) {
                pool.map.delete(slot.id)
                slot.id = null
                slot.data = null
            }
        }

        for (const target of treeTargets) {
            let slotIndex = pool.map.get(target.id)
            if (slotIndex === undefined) {
                slotIndex = pool.slots.findIndex((s) => s.id === null)
                if (slotIndex === -1) continue
                pool.map.set(target.id, slotIndex)
                pool.slots[slotIndex].id = target.id
            }
            pool.slots[slotIndex].data = target
        }

        return pool.slots.map((slot) => slot.data)
    }, [treeTargets])

    return (
        <group>
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
                />
            ))}
            {treePoolSlots.map((tree, index) => {
                const visible = Boolean(tree)
                const position = tree?.position ?? [0, -9999, 0]
                const rotation = tree?.rotation ?? [0, 0, 0]
                const scale = tree?.scale ?? 1
                const seed = tree?.seed ?? 0

                return (
                    <Tree
                        key={`tree-pool-${index}`}
                        position={position}
                        rotation={rotation}
                        scale={scale}
                        seed={seed}
                        visible={visible}
                        leavesMaterial={leavesMaterial}
                        trunkMaterial={trunkMaterial}
                        rigidBodyMaterial={rigidBodyMaterial}
                        treeScene={treeModel.scene}
                    />
                )
            })}
            <Wind initialCircleRadius={START_CIRCLE_RADIUS} circleRadiusRef={circleRadiusRef} />
        </group>
    )
}

useGLTF.preload(treeUrl)
