import { mulberry32 } from './randomUtils.js'

const WIND_GRID_SPACING = 2.5
const WIND_HEIGHT = 1
const WIND_HEIGHT_VARIATION_RANGE = 3.0
const WIND_TIME_OFFSET_MAX = 20

export function generateWindLineInstances(x, z, size) {
    const seed = ((x * 73856093) ^ (z * 19349663) ^ 0x9e3779b9) >>> 0
    const rng = mulberry32(seed)
    const instances = []

    const halfSize = size * 0.5
    const start = -halfSize + WIND_GRID_SPACING * 0.5
    const end = halfSize - WIND_GRID_SPACING * 0.5

    let index = 0
    for (let localX = start; localX <= end + 1e-4; localX += WIND_GRID_SPACING) {
        for (let localZ = start; localZ <= end + 1e-4; localZ += WIND_GRID_SPACING) {
            instances.push({
                id: `${x}_${z}_${index}`,
                position: [localX, WIND_HEIGHT + rng() * WIND_HEIGHT_VARIATION_RANGE, localZ],
                timeOffset: rng() * WIND_TIME_OFFSET_MAX,
            })
            index += 1
        }
    }

    return instances
}
