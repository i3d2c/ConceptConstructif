import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Zone } from '../domain/models/Zone'
import type { Scale } from '../domain/models/Scale'

interface StoreRef {
  activeZone: Zone | undefined
}

export class Scene3D {
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private controls: OrbitControls
  private store: StoreRef
  private animId = 0

  constructor(container: HTMLElement, store: StoreRef) {
    this.store = store

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color('#111122')

    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000)
    this.camera.position.set(0, 10, 20)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(10, 20, 10)
    this.scene.add(dir)

    this.scene.add(new THREE.GridHelper(50, 50, 0x2a2a4a, 0x1a1a2e))

    this.animate()
  }

  private animate() {
    this.animId = requestAnimationFrame(() => this.animate())
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  rebuild() {
    const toRemove = this.scene.children.filter(c => c.userData['trace'] === true)
    toRemove.forEach(c => this.scene.remove(c))

    const zone = this.store.activeZone
    if (!zone?.scale) return

    const scale: Scale = zone.scale

    for (const trace of zone.traces) {
      const ca = zone.colorAssignments.find(c => c.id === trace.colorAssignmentId)
      if (!ca) continue

      const color = new THREE.Color(ca.color)

      if (trace.type === 'line') {
        const H = ca.hauteur
        const E = ca.epaisseur

        for (let i = 0; i < trace.points.length - 1; i++) {
          const [x1, y1] = trace.points[i]
          const [x2, y2] = trace.points[i + 1]
          const wx1 = x1 * scale.ratio
          const wz1 = y1 * scale.ratio
          const wx2 = x2 * scale.ratio
          const wz2 = y2 * scale.ratio

          const length = Math.hypot(wx2 - wx1, wz2 - wz1)
          const geom = new THREE.BoxGeometry(length, H, E)
          const mat = new THREE.MeshLambertMaterial({ color })
          const mesh = new THREE.Mesh(geom, mat)

          const cx = (wx1 + wx2) / 2
          const cz = (wz1 + wz2) / 2
          mesh.position.set(cx, trace.up + H / 2, cz)
          mesh.rotation.y = -Math.atan2(wz2 - wz1, wx2 - wx1)
          mesh.userData['trace'] = true

          this.scene.add(mesh)
        }
      } else {
        const shape = new THREE.Shape()
        const pts: [number, number][] = trace.points.map(([px, py]) => [px * scale.ratio, py * scale.ratio])
        shape.moveTo(pts[0][0], pts[0][1])
        for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
        shape.closePath()

        const geom = new THREE.ShapeGeometry(shape)
        const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide })
        const mesh = new THREE.Mesh(geom, mat)
        const angleRad = trace.angle ? (trace.angle * Math.PI) / 180 : 0
        mesh.rotation.x = Math.PI / 2 - angleRad
        mesh.position.y = trace.up

        mesh.userData['trace'] = true
        this.scene.add(mesh)
      }
    }
  }

  getDataURL(): string {
    return this.renderer.domElement.toDataURL('image/png')
  }

  destroy() {
    cancelAnimationFrame(this.animId)
    this.controls.dispose()
    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}
