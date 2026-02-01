import React from 'react'
import { Tree } from './Tree.jsx'

export default function Trees({ position, leavesMaterial, trunkMaterial, treeScene }) {
    return <Tree position={position} rotation={[0, 0, 0]} leavesMaterial={leavesMaterial} trunkMaterial={trunkMaterial} treeScene={treeScene} />
}
