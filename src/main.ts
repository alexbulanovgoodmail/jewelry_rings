import '~/assets/css/main.css'
import '~/assets/scss/main.scss'

import SplitType from 'split-type'
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

let _contactRotation = false
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

    function toggleWireframe(
      model: THREE.Object3D,
      isWireframe: boolean,
      opacity: number,
    ): void {
      model.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
          const mesh = child as THREE.Mesh
          const material = mesh.material as THREE.MeshStandardMaterial
          material.wireframe = isWireframe
          material.opacity = opacity
          material.transparent = opacity < 1 ? true : false
        }
      })
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
      x: 0.05,
      z: 2.5,
      y: -0.34,
    })

    tl.to(
      _ring.rotation,
      {
        z: 1,
      },
      '<',
    )

    const mm2 = gsap.matchMedia()

    mm2.add(
      {
        isDesktop: '(min-width: 768px)',
        isMobile: '(max-width: 767px)',
      },
      (context) => {
        const { isDesktop } = context.conditions as {
          isDesktop: boolean
          isMobile: boolean
        }

        // Timeline для wireframe материала
        ScrollTrigger.create({
          trigger: '.contact',
          start: 'top bottom',
          end: 'bottom center',
          id: 'wireframe',
          onEnter: () => {
            toggleWireframe(_ring as THREE.Object3D, true, 1)
            _contactRotation = false
          },
          onEnterBack: () => {
            toggleWireframe(_ring as THREE.Object3D, true, 1)
            _contactRotation = false
          },
          onLeave: () => {
            toggleWireframe(_ring as THREE.Object3D, false, 1)
            _contactRotation = false
          },
          onLeaveBack: () => {
            toggleWireframe(_ring as THREE.Object3D, false, 1)
            _contactRotation = false
          },
        })

        // Timeline для перемещения кольца
        const tl2 = gsap.timeline({
          scrollTrigger: {
            trigger: '.contact',
            start: 'top bottom',
            end: 'bottom+=50% center',
            scrub: 1,

            id: 'position',
          },
        })

        if (_ring) {
          tl2.to(_ring.position, {
            z: 0.3,
            x: isDesktop ? 0.4 : 0,
            y: -0.23,
          })

          if (isDesktop) {
            tl2.to(_ring.position, {
              x: 0,
            })
          }
        }
      },
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

  window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    if (_camera && _renderer) {
      _camera.aspect = sizes.width / sizes.height
      _camera.updateProjectionMatrix()

      _renderer.setSize(sizes.width, sizes.height)
      _renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
  })
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

    if (_renderer && _scene && _camera) {
      _renderer.render(_scene, _camera)
    }

    window.requestAnimationFrame(tick)
  }

  tick()
}

function animateWords() {
  const wordElement = document.getElementById('animated-word')
  const words = ['Romance', 'Elegance', 'Timeless', 'Beauty']
  let currentWordIndex = 0
  let _split: SplitType | null = null

  function changeWord() {
    if (!wordElement) return

    wordElement.textContent = words[currentWordIndex]

    _split = new SplitType('#animated-word', { types: 'chars' })

    if (_split.chars) {
      animateChars(_split.chars)
      currentWordIndex = (currentWordIndex + 1) % words.length
    }
  }

  function animateChars(chars: HTMLElement[]) {
    gsap.from(chars, {
      yPercent: 100,
      stagger: 0.05,
      duration: 1.5,
      ease: 'power3.out',
      onComplete: () => {
        if (_split) {
          _split.revert()
        }
      },
    })
  }

  setInterval(changeWord, 3000)
}

function animateDetails() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.details',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })

  tl.to('.details-title', {
    y: -100,
  }).to(
    '.details-box',
    {
      y: -50,
      height: 300,
    },
    '<',
  )

  gsap.to('.marquee-text', {
    scrollTrigger: {
      trigger: '.marquee',
      start: 'top 80%',
      end: 'bottom top',
      scrub: true,
    },
    x: 200,
  })
}

function animateSlider() {
  const mm = gsap.matchMedia()

  mm.add(
    {
      isDesktop: '(min-width: 768px)',
      isMobile: '(max-width: 767px)',
    },
    (context) => {
      const { isDesktop } = context.conditions as {
        isDesktop: boolean
        isMobile: boolean
      }
      const slider = document.querySelector('.slider') as HTMLElement
      const slides = gsap.utils.toArray('.slide') as HTMLElement[]

      const tl = gsap.timeline({
        defaults: { ease: 'none', duration: 1 },
        scrollTrigger: {
          trigger: slider,
          pin: isDesktop ? true : false,
          scrub: 1,
          end: () => (isDesktop ? `+=${slider.offsetWidth}` : 'bottom'),
        },
      })

      if (isDesktop) {
        tl.to(
          slider,
          {
            xPercent: -66,
          },
          '<',
        ).to(
          '.slider-progress',
          {
            width: '100%',
          },
          '<',
        )
      }

      slides.forEach((slide) => {
        const split = new SplitType(
          slide.querySelector('.slide-text') as HTMLElement,
          { types: 'chars' },
        )

        tl.from(split.chars, {
          opacity: 0,
          y: 10,
          stagger: 0.02,
          scrollTrigger: {
            trigger: slide.querySelector('.slide-text') as HTMLElement,
            start: 'top bottom',
            end: 'bottom center',
            containerAnimation: isDesktop ? tl : undefined,
            scrub: 1,
          },
        })
      })
    },
  )
}

function animateContact() {
  gsap.set('.contact-title span, .contact-cta span', {
    yPercent: 100,
  })
  gsap.set('.contact-description p', {
    opacity: 0,
  })

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.contact',
      start: '-10% center',
      end: 'bottom-=30% center',
      scrub: true,
    },
  })

  tl.to(['.contact .line-top', '.contact .line-bottom'], {
    width: '100%',
  })
    .to('.contact-title span, .contact-cta span', {
      yPercent: 0,
    })
    .to('.contact-description p', {
      opacity: 1,
    })
}

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll()
  initThreeJS()
  initRenderLoop()
  animateWords()
  animateDetails()
  animateSlider()
  animateContact()
})
