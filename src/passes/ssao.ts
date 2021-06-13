import * as THREE from 'three';
import { Blur } from './blur';

// @ts-ignore
import ssaoFrag from '../shaders/ssao.frag';
// @ts-ignore
import ssaoVert from '../shaders/ssao.vert';

type GBuffer = {
	normal: THREE.Texture;
	albedo: THREE.Texture;
	position: THREE.Texture;
};

export class SSAO {
	kernelSize = 64;
	bias = 0.025;
	radius = 0.2;

  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
	scene = new THREE.Scene();

	samples: THREE.Vector3[] = [];
	noise?: THREE.DataTexture;

  renderTarget: THREE.WebGLRenderTarget;

	material: THREE.RawShaderMaterial;

	blurPass: Blur;

	finalTexture: THREE.Texture;

	uniforms: Record<string, { value: any }>;

	constructor(
    public renderer: THREE.WebGLRenderer, 
    public renderCamera: THREE.Camera, 
    gBuffer: GBuffer
  ) {

		const s = new THREE.Vector2()
		this.renderer.getSize(s)

		s.multiplyScalar(0.5)
		
	  this.renderTarget = new THREE.WebGLRenderTarget(s.x, s.y);

    this.renderTarget.texture.minFilter = THREE.NearestFilter
    this.renderTarget.texture.magFilter = THREE.NearestFilter

		this.samples = this.generateSamples();
		this.noise = this.generateNoise();
		this.camera.position.set(0, 0, 5);

		this.uniforms = {
			// G-Buffer
			tAlbedo: { value: gBuffer.albedo },
			tNormal: { value: gBuffer.normal },
			tWorld: { value: gBuffer.position },

			projection: { value: new THREE.Matrix4() },

			kernelSize: { value: this.kernelSize },
			bias: { value: this.bias },
			radius: { value: this.radius },
			samples: { value: this.samples },
			noise: { value: this.noise },
			noiseScale: { value: new THREE.Vector2(s.x/ 4, s.y / 4) },
		};

		this.material = new THREE.RawShaderMaterial({
			vertexShader: ssaoVert,
			fragmentShader: ssaoFrag,
			glslVersion: THREE.GLSL3,
			uniforms: this.uniforms,
		});

		this.blurPass = new Blur(this.renderer, this.renderTarget.texture, this.noise, gBuffer)

		this.scene.add(new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2), 
      this.material
    ));

		this.finalTexture = this.renderTarget.texture
		this.finalTexture = this.blurPass.renderTarget.texture
	}

	generateSamples = () => {
		const samples: THREE.Vector3[] = [];

		for (let i = 0; i < this.kernelSize; i++) {
			const sample = new THREE.Vector3();

			sample.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random());

			let scale = i / this.kernelSize;
			scale = THREE.MathUtils.lerp(0.1, 1, scale * scale);

			sample.normalize();
			sample.multiplyScalar(scale);

			samples.push(sample);
		}

		return samples;
	};

	generateNoise = () => {
		const h = 4;
		const w = 4;
		const size = w * h;
		const data = new Float32Array(3 * size);

		for (let i = 0; i < size; i++) {
			const stride = i * 3;
			data[stride] = Math.random() * 2.0 - 1.0;
			data[stride + 1] = Math.random() * 2.0 - 1.0;
			data[stride + 2] = 0;
		}

		const texture = new THREE.DataTexture(data, w, h, THREE.RGBFormat, THREE.FloatType);
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter
    texture.minFilter = THREE.NearestFilter

		return texture;
	};

	beforeRender = () => {
		(this.material.uniforms.projection.value as THREE.Matrix4).copy(this.renderCamera.projectionMatrix);
	};

	render = () => {
		this.beforeRender();

		this.renderer.setRenderTarget(this.renderTarget);
		this.renderer.render(this.scene, this.camera);

		this.blurPass.render()

		this.renderer.setRenderTarget(null);
	};
}
