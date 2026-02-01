import { useMemo, useEffect } from 'react'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

import Grass from './Grass.jsx'
import Stones from './Stones.jsx'
import Trees from './Trees.jsx'
import useStore from '../stores/useStore.jsx'
import { generateChunkStones } from './utils/stoneUtils.js'

export default function TerrainChunk({
    x,
    z,
    size,
    noise2D,
    noiseTexture,
    terrainMaterial,
    grassMaterial,
    stoneMaterial,
    stoneGeometry,
    leavesMaterial,
    trunkMaterial,
    treeScene,
}) {
    const terrainParameters = useStore((s) => s.terrainParameters)
    const stoneParameters = useStore((s) => s.stoneParameters)

    const treePosition = useMemo(() => {
        const worldX = x * size
        const worldZ = z * size
        const height = noise2D(worldX * terrainParameters.scale, worldZ * terrainParameters.scale) * terrainParameters.amplitude
        return [0, height, 0]
    }, [x, z, size, noise2D, terrainParameters.scale, terrainParameters.amplitude])

    const stonesKey = useMemo(
        () =>
            `stones_${x}_${z}_${stoneParameters.count}_${stoneParameters.minScale}_${stoneParameters.maxScale}_${stoneParameters.yOffset}_${stoneParameters.noiseScale}_${stoneParameters.noiseThreshold}`,
        [x, z, stoneParameters.count, stoneParameters.minScale, stoneParameters.maxScale, stoneParameters.yOffset, stoneParameters.noiseScale, stoneParameters.noiseThreshold]
    )

    const stoneField = useMemo(() => {
        const capacity = 500
        const current = generateChunkStones(x, z, size, noise2D, stoneParameters, terrainParameters)
        const neighbors = []

        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dz === 0) continue

                const neighborStones = generateChunkStones(x + dx, z + dz, size, noise2D, stoneParameters, terrainParameters, true, true).stones
                for (const s of neighborStones) {
                    neighbors.push({ ...s, x: s.x + dx * size, z: s.z + dz * size })
                }
            }
        }

        return {
            instances: current.instances,
            stones: [...current.stones, ...neighbors],
            currentStones: current.stones,
            capacity,
        }
    }, [stoneParameters, noise2D, x, z, size, terrainParameters.scale, terrainParameters.amplitude])

    const geometry = useMemo(() => {
        const { segments, scale, amplitude } = terrainParameters
        const geo = new THREE.PlaneGeometry(size, size, segments, segments)
        const posAttribute = geo.attributes.position
        const chunkWorldX = x * size
        const chunkWorldZ = z * size

        for (let i = 0; i < posAttribute.count; i++) {
            const worldX = posAttribute.getX(i) + chunkWorldX
            const worldZ = -posAttribute.getY(i) + chunkWorldZ
            posAttribute.setZ(i, noise2D(worldX * scale, worldZ * scale) * amplitude)
        }
        return geo
    }, [noise2D, size, x, z, terrainParameters])

    useEffect(() => () => geometry.dispose(), [geometry])

    return (
        <group position={[x * size, 0, z * size]}>
            <RigidBody type="fixed" colliders="trimesh" userData={{ name: 'terrain' }}>
                <mesh geometry={geometry} material={terrainMaterial} rotation-x={-Math.PI / 2} />
            </RigidBody>

            <Grass
                size={size}
                chunkX={x * size}
                chunkZ={z * size}
                chunkIndexX={x}
                chunkIndexZ={z}
                noise2D={noise2D}
                noiseTexture={noiseTexture}
                scale={terrainParameters.scale}
                amplitude={terrainParameters.amplitude}
                stones={stoneField.stones}
                grassMaterial={grassMaterial}
            />

            <Stones key={stonesKey} stones={stoneField.currentStones} maxCount={stoneField.capacity} stoneMaterial={stoneMaterial} stoneGeometry={stoneGeometry} />

            <Trees position={treePosition} leavesMaterial={leavesMaterial} trunkMaterial={trunkMaterial} treeScene={treeScene} />
        </group>
    )
}
