import * as THREE from 'three'

// @ts-ignore
import simpleDepthFrag from '../shaders/simpleDepth.frag'
// @ts-ignore
import simpleDepthVert from '../shaders/simpleDepth.vert'

type Light = any

const size = new THREE.Vector2()

export class ShadowMap {

  renderTarget: THREE.WebGLRenderTarget;
  camera: THREE.Camera;
  depthMaterial: THREE.RawShaderMaterial;

  w: number = 1024;
  h: number = 1024;
 
  lightProjection: THREE.Matrix4
  lightView: THREE.Matrix4
  lightSpaceMatrix: THREE.Matrix4

  constructor(public renderer: THREE.WebGLRenderer, public scene: THREE.Scene, public light: Light) {
    const target =  new THREE.Vector3(0, 0, 0)
    const up = new THREE.Vector3(0, 1, 0)

    this.renderTarget = new THREE.WebGLRenderTarget(this.w, this.h);
    this.camera = new THREE.Camera()
    
    this.lightProjection = new THREE.Matrix4().makeOrthographic(-3, 3, -3, 3, 0.5, 10.)
    this.lightView = new THREE.Matrix4().lookAt(
      light.position, 
      target, 
      up
    )
      
    this.lightSpaceMatrix = (new THREE.Matrix4()).multiplyMatrices(this.lightView, this.lightProjection)

    this.depthMaterial = new THREE.RawShaderMaterial({
      vertexShader: simpleDepthVert,
      fragmentShader: simpleDepthFrag,
      uniforms: {
        lightSpaceMatrix: {
          value: this.lightSpaceMatrix
        }
      },
      defines: {
        INSTANCED: true,
      },
      glslVersion: THREE.GLSL3,
    })

  }

  render = () => {
    this.renderer.getSize(size)
    
    this.scene.overrideMaterial = this.depthMaterial;
    this.renderer.setSize(this.w, this.h)
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);

    this.renderer.setSize(size.x, size.y)

    this.scene.overrideMaterial = null
  }
}