import { useMemo, useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

import windLineVertexShader from '../shaders/windLine/vertex.glsl'
import windLineFragmentShader from '../shaders/windLine/fragment.glsl'

import useStore from '../stores/useStore.jsx'
import { generateWindLineInstances } from './utils/windUtils.js'
import { sharedNoise2D } from './utils/worldNoise.js'

export default function Wind() {
    const [activeChunks, setActiveChunks] = useState([])
    const currentChunk = useRef({ x: 0, z: 0, size: 0 })

    const terrainParameters = useStore((state) => state.terrainParameters)
    const windDirection = useStore((state) => state.windParameters.direction)
    const terrainScale = terrainParameters.scale
    const terrainAmplitude = terrainParameters.amplitude
    const chunkSize = terrainParameters.chunkSize
    const windChunkSize = chunkSize * 1.5

    const baseGeometry = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(10, 0.15, 20, 1)
        geometry.rotateX(-Math.PI / 2)
        return geometry
    }, [])

    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            vertexShader: windLineVertexShader,
            fragmentShader: windLineFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uTimeMultiplier: { value: 0.1 },
                uAlphaMultiplier: { value: 0.5 },
                uUVmin: { value: -3.5 },
                uUVmax: { value: 4.5 },
            },
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
        })
    }, [])

    useFrame(() => {
        const state = useStore.getState()
        const ballPosition = state.ballPosition
        const safeChunkSize = Math.max(0.0001, windChunkSize)
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

    const windLines = useMemo(() => {
        if (!activeChunks || activeChunks.length === 0) return []
        const lines = []
        for (const chunk of activeChunks) {
            const originX = chunk.x * windChunkSize
            const originZ = chunk.z * windChunkSize
            const chunkLines = generateWindLineInstances(chunk.x, chunk.z, windChunkSize)
            for (const line of chunkLines) {
                lines.push({
                    position: [line.position[0] + originX, line.position[1], line.position[2] + originZ],
                    timeOffset: line.timeOffset ?? 0,
                })
            }
        }
        return lines
    }, [activeChunks, chunkSize])

    const mergedGeometry = useMemo(() => {
        if (windLines.length === 0) {
            return new THREE.BufferGeometry()
        }

        const basePosition = baseGeometry.attributes.position
        const baseUv = baseGeometry.attributes.uv
        const baseIndex = baseGeometry.index
        const baseVertexCount = basePosition.count
        const baseIndexCount = baseIndex ? baseIndex.count : 0

        const totalVertexCount = baseVertexCount * windLines.length
        const totalIndexCount = baseIndex ? baseIndexCount * windLines.length : 0
        const positions = new Float32Array(totalVertexCount * 3)
        const uvs = new Float32Array(totalVertexCount * 2)
        const timeOffsets = new Float32Array(totalVertexCount)
        const indices = baseIndex ? new (totalVertexCount > 65535 ? Uint32Array : Uint16Array)(totalIndexCount) : null

        const angle = Math.PI / 2 + (windDirection ?? 0)
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)

        for (let i = 0; i < windLines.length; i++) {
            const [offsetX, offsetY, offsetZ] = windLines[i].position
            const timeOffset = windLines[i].timeOffset
            const vertexOffset = i * baseVertexCount
            const indexOffset = i * baseIndexCount

            for (let v = 0; v < baseVertexCount; v++) {
                const x = basePosition.getX(v)
                const y = basePosition.getY(v)
                const z = basePosition.getZ(v)

                const rotatedX = x * cos - z * sin
                const rotatedZ = x * sin + z * cos
                const worldX = rotatedX + offsetX
                const worldZ = rotatedZ + offsetZ
                const yOffset = sharedNoise2D(worldX * terrainScale, worldZ * terrainScale) * terrainAmplitude
                const worldY = y + offsetY + yOffset

                const posIndex = (vertexOffset + v) * 3
                positions[posIndex] = worldX
                positions[posIndex + 1] = worldY
                positions[posIndex + 2] = worldZ

                const uvIndex = (vertexOffset + v) * 2
                uvs[uvIndex] = baseUv.getX(v)
                uvs[uvIndex + 1] = baseUv.getY(v)

                timeOffsets[vertexOffset + v] = timeOffset
            }

            if (indices) {
                for (let j = 0; j < baseIndexCount; j++) {
                    indices[indexOffset + j] = baseIndex.getX(j) + vertexOffset
                }
            }
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
        geometry.setAttribute('aTimeOffset', new THREE.BufferAttribute(timeOffsets, 1))
        if (indices) {
            geometry.setIndex(new THREE.BufferAttribute(indices, 1))
        }
        geometry.computeBoundingSphere()
        return geometry
    }, [windLines, baseGeometry, windDirection, terrainScale, terrainAmplitude])

    useEffect(() => {
        return () => {
            mergedGeometry.dispose()
        }
    }, [mergedGeometry])

    useFrame(({ clock }) => {
        material.uniforms.uTime.value = clock.elapsedTime
    })

    return <mesh geometry={mergedGeometry} material={material} frustumCulled={false} dispose={null} />
}
