import * as THREE from 'three';

// @ts-ignore
import blurFrag from '../shaders/blur.frag';
// @ts-ignore
import blurVert from '../shaders/blur.vert';

type GBuffer = {
	normal: THREE.Texture;
	albedo: THREE.Texture;
	world: THREE.Texture;
};

export class Blur {
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
	scene = new THREE.Scene();

  renderTarget: THREE.WebGLRenderTarget;

	material: THREE.RawShaderMaterial;

	constructor(
    public renderer: THREE.WebGLRenderer, 
    texture: THREE.Texture,
    noise: THREE.Texture,
    gBuffer: GBuffer
  ) {
    const s = new THREE.Vector2()
		this.renderer.getSize(s)

		s.multiplyScalar(0.5)

	  this.renderTarget = new THREE.WebGLRenderTarget(s.x, s.y);

    this.renderTarget.texture.minFilter = THREE.NearestFilter
    this.renderTarget.texture.magFilter = THREE.NearestFilter

		this.camera.position.set(0, 0, 5);

		const uniforms = {
			// G-Buffer
			tAlbedo: { value: gBuffer.albedo },
			tNormal: { value: gBuffer.normal },
			tWorld: { value: gBuffer.world },

      tDiffuse: { value: texture },
      tNoise: { value: noise },
		};

		this.material = new THREE.RawShaderMaterial({
			vertexShader: blurVert,
			fragmentShader: blurFrag,
			glslVersion: THREE.GLSL3,
			uniforms,
		});

		this.scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2), 
      this.material
    ));
	}

	render = () => {

		this.renderer.setRenderTarget(this.renderTarget);
		this.renderer.render(this.scene, this.camera);

		this.renderer.setRenderTarget(null);
	};
}
