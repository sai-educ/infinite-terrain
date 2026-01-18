import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

const useStore = create(
    subscribeWithSelector((set) => ({
        trailTexture: null,
        setTrailTexture: (texture) => {
            set({ trailTexture: texture })
        },

        ballPosition: new THREE.Vector3(0, 0, 0),
        setBallPosition: (position) => {
            set({ ballPosition: position })
        },

        smoothedCircleCenter: new THREE.Vector3(0, 0, 0),
        setSmoothedCircleCenter: (position) => {
            set({ smoothedCircleCenter: position })
        },

        landBallDistance: 1.0,
        setLandBallDistance: (distance) => {
            set({ landBallDistance: distance })
        },

        /**
         * Terrain parameters
         */
        terrainParameters: {
            color: '#3f5553',
            backgroundColor: '#203a3b',
            chunkSize: 10,
            segments: 16,
            scale: 0.05,
            amplitude: 2,
        },
        setTerrainParameters: (parameters) => {
            set({ terrainParameters: parameters })
        },

        /**Border parameters */
        borderParameters: {
            noiseStrength: 0.45,
            noiseScale: 0.35,
            circleRadiusFactor: 0.75,
            grassFadeOffset: 3.5,
            groundOffset: -0.75,
            groundFadeOffset: 1.0,
        },
        setBorderParameters: (parameters) => {
            set({ borderParameters: parameters })
        },

        /**
         * Dithering parameters
         */
        ditheringParameters: {
            ditherMode: 'Diamond', // 'Diamond' | 'Bayer'
            pixelSize: 1,
        },
        setDitheringParameters: (parameters) => {
            set({ ditheringParameters: parameters })
        },

        /**
         * Grass parameters
         */
        grassParameters: {
            colorBase: '#396c18',
            colorTop: '#77aa1a',
            count: 2500,
            segmentsCount: 4,
            width: 0.15,
            height: 1.15,
            leanFactor: 0.2,
            sobelMode: 2.0,
            windScale: 0.35,
            windStrength: 0.7,
            windSpeed: 1.0,

            // Procedural flowers (small blossom at the tip of some blades)
            flowersEnabled: true,
            flowerDensity: 0.02, // ~3.5% of blades become flowers
            flowerNoiseScale: 0.26, // noise UV scale used to cluster flower density
            flowerHeightBoost: 0.13, // flower blades are slightly taller than grass
            flowerTipStart: 0.68, // where on the blade (0..1) blossoms start
            flowerBaseScale: 1.0, // make flower blades thinner at the base
            flowerExpand: 2.25, // widens the blade near the tip for visible blossoms
            flowerColorA: '#ffffff', // white
            flowerColorB: '#ffcc00', // yellow
            flowerColorC: '#ff73be', // pink
            flowerColorD: '#6e8dff', // blue-ish
        },
        setGrassParameters: (parameters) => {
            set({ grassParameters: parameters })
        },

        /**
         * Stone parameters
         */
        stoneParameters: {
            enabled: true,
            count: 10, // per chunk
            minScale: 0.4,
            maxScale: 1.2,
            yOffset: 0.02,
            color: '#adadad', //#707e89
            noiseScale: 0.15,
            noiseThreshold: 0.55,

            // Grass suppression around stones (computed from actual stone instances)
            grassClearRadiusMultiplier: 0.8, // >1 means grass clears a bit beyond the stone mesh
            grassFadeWidth: 0.4, // extra fade distance beyond the clear radius
        },
        setStoneParameters: (parameters) => {
            set({ stoneParameters: parameters })
        },

        /**
         * Trail parameters
         */
        trailParameters: {
            chunkSize: 256,
            glowSize: 0.18,
            fadeAlpha: 0.1,
            glowAlpha: 0.3,
            showCanvas: false,
        },
        setTrailParameters: (parameters) => {
            set({ trailParameters: parameters })
        },

        /**
         * Ball parameters
         */
        ballParameters: {
            color: '#582ec7', // Changed from red to purple/blue-ish by default
        },
        setBallParameters: (parameters) => {
            set({ ballParameters: parameters })
        },

        /**
         * Performance & Debug parameters
         */
        perfVisible: false,
        setPerfVisible: (visible) => {
            set({ perfVisible: visible })
        },

        physicsDebug: false,
        setPhysicsDebug: (visible) => {
            set({ physicsDebug: visible })
        },

        backgroundWireframe: false,
        setBackgroundWireframe: (visible) => {
            set({ backgroundWireframe: visible })
        },

        /**
         * Theme
         */
        theme: 'dark', // Set default theme to 'dark'
        setTheme: (theme) => {
            const themes = {
                dark: {
                    terrain: '#3f5553',
                    background: '#203a3b',
                    grassBase: '#396c18',
                    grassTop: '#77aa1a',
                    ball: '#582ec7',
                },
                light: {
                    terrain: '#908343',
                    background: '#9a9065',
                    grassBase: '#669019',
                    grassTop: '#acc125',
                    ball: '#c7442d',
                },
            }

            const colors = themes[theme]

            set((state) => ({
                theme,
                terrainParameters: { ...state.terrainParameters, color: colors.terrain, backgroundColor: colors.background },
                grassParameters: { ...state.grassParameters, colorBase: colors.grassBase, colorTop: colors.grassTop },
                ballParameters: { ...state.ballParameters, color: colors.ball },
            }))
        },

        /**
         * Controls
         */
        controls: {
            forward: false,
            backward: false,
            leftward: false,
            rightward: false,
            jump: false,
        },
        setControl: (name, value) => {
            set((state) => ({
                controls: {
                    ...state.controls,
                    [name]: value,
                },
            }))
        },
    }))
)

export default useStore
