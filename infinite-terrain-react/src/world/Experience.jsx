import { Perf } from 'r3f-perf'
import { OrbitControls } from '@react-three/drei'

import Lights from './Lights.jsx'
import Ocean from './Ocean.jsx'
import Terrain from './Terrain.jsx'
import BallTrailCanvas from './BallTrailCanvas.jsx'
import Controls from './Controls.jsx'
import useStore from '../stores/useStore.jsx'

export default function Experience() {
    const perfVisible = useStore((state) => state.perfVisible)
    const backgroundColor = useStore((state) => state.terrainParameters.backgroundColor)
    const landElevation = useStore((state) => state.oceanParameters.landElevation)

    return (
        <>
            <color args={[backgroundColor]} attach="background" />

            {perfVisible && <Perf position="top-left" />}

            <Lights />
            <Ocean />
            <Terrain />
            <OrbitControls
                makeDefault
                enableDamping
                enablePan={false}
                dampingFactor={0.08}
                minDistance={20}
                maxDistance={260}
                maxPolarAngle={Math.PI / 2.02}
                target={[0, landElevation, 0]}
            />

            <BallTrailCanvas />
            <Controls />
        </>
    )
}
