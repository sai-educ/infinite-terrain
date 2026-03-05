import { Perf } from 'r3f-perf'
import { OrbitControls } from '@react-three/drei'

import Lights from './Lights.jsx'
import Terrain from './Terrain.jsx'
import BallTrailCanvas from './BallTrailCanvas.jsx'
import Controls from './Controls.jsx'
import useStore from '../stores/useStore.jsx'

export default function Experience() {
    const perfVisible = useStore((state) => state.perfVisible)
    const backgroundColor = useStore((state) => state.terrainParameters.backgroundColor)

    return (
        <>
            <color args={[backgroundColor]} attach="background" />

            {perfVisible && <Perf position="top-left" />}

            <Lights />
            <Terrain />
            <OrbitControls
                makeDefault
                enableDamping
                dampingFactor={0.08}
                minDistance={20}
                maxDistance={260}
                maxPolarAngle={Math.PI / 2.02}
            />

            <BallTrailCanvas />
            <Controls />
        </>
    )
}
