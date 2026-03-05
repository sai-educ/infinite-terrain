import './style.css'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Experience from './world/Experience.jsx'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'
import Loader from './loader/Loader.jsx'
import ControlsIcons from './ui/ControlsIcons.jsx'
import ThemeSwitcher from './ui/ThemeSwitcher.jsx'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <>
        <KeyboardControls
            map={[
                { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
                { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
                { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
                { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
                { name: 'jump', keys: ['Space'] },
                { name: 'reset', keys: ['Enter'] },
            ]}
        >
            <Canvas
                dpr={[1, 1.5]}
                gl={{
                    antialias: true,
                    powerPreference: 'high-performance',
                }}
                camera={{
                    fov: 50,
                    near: 0.1,
                    far: 1000,
                    position: [0, 55, 70],
                }}
            >
                <Experience />
            </Canvas>
            <Leva collapsed={false} />
            <ControlsIcons />
        </KeyboardControls>
        <Loader />
        <ThemeSwitcher />
    </>
)
