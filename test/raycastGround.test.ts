/* eslint-disable test/no-import-node-test */
import * as assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { raycastGround } from '../app/features/three/utils/raycastGround'

const EPSILON = 0.000001

test('center screen projects to origin on ground', () => {
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 10, 10)
  camera.lookAt(0, 0, 0)
  const ndc = new THREE.Vector2(0, 0)
  const point = raycastGround(ndc, camera)
  assert.ok(point)
  assert.ok(point!.distanceTo(new THREE.Vector3(0, 0, 0)) < EPSILON)
})
