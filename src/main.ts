import '~/assets/css/main.css'
import '~/assets/scss/main.scss'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import ringModelUrl from '~/assets/model/ring.glb?url'

gsap.registerPlugin(ScrollTrigger)

function initSmoothScroll() {
  const lenis = new Lenis()

  lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000)
  })

  gsap.ticker.lagSmoothing(0)
}

const _contactRotation = false
let _ring: THREE.Group | null = null
let _renderer: THREE.WebGLRenderer | null = null
let _scene: THREE.Scene | null = null
let _camera: THREE.PerspectiveCamera | null = null

const loader = new GLTFLoader()

function initThreeJS() {
  _scene = new THREE.Scene()

  loader.load(ringModelUrl, async function (gltf) {
    _ring = gltf.scene
    _ring.position.set(0, 0, 0)
    _ring.scale.set(0.5, 0.5, 0.5)
    _scene?.add(_ring)

    // Debug GUI только в dev режиме
    if (import.meta.env.DEV) {
      const dat = await import('dat.gui')
      const gui = new dat.GUI()
      const ringFolder = gui.addFolder('Ring')
      ringFolder.add(_ring.position, 'x').min(-3).max(3).step(0.01)
      ringFolder.add(_ring.position, 'y').min(-3).max(3).step(0.01)
      ringFolder.add(_ring.position, 'z').min(-3).max(3).step(0.01)
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'section.details',
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
      defaults: {
        ease: 'power3.out',
        duration: 3,
      },
    })

    tl.to(_ring.position, {
      z: 3.5,
      y: -0.34,
    })

    tl.to(
      _ring.rotation,
      {
        z: 1,
      },
      '<',
    )

    const directionalLight = new THREE.DirectionalLight('lightblue', 10)
    directionalLight.position.z = 8
    _scene?.add(directionalLight)
  })

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  _camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    100,
  )
  _camera.position.x = 0
  _camera.position.y = 0
  _camera.position.z = 1.5
  _scene.add(_camera)

  const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement
  _renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
  })
  _renderer.setSize(sizes.width, sizes.height)
  _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

function initRenderLoop() {
  const clock = new THREE.Clock()

  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    if (_ring) {
      if (!_contactRotation) {
        _ring.rotation.y = 0.5 * elapsedTime
        _ring.rotation.x = 0
        _ring.rotation.z = 0
      } else {
        _ring.rotation.y = 0
        _ring.rotation.x = 0.2 * elapsedTime
        _ring.rotation.z = 0.2 * elapsedTime
      }
    }

    // Update Orbital Controls
    // controls.update()

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera)
    }

    window.requestAnimationFrame(tick)
  }

  tick()
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll()
  initThreeJS()
  initRenderLoop()
})
