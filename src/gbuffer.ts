
import * as THREE from 'three'

type gBufferTextures = "albedo" | "normal" | "position" | "material"

export default class GBuffer {
	textures: Record<gBufferTextures, THREE.Texture>
	mrt: THREE.WebGLMultipleRenderTargets

	camera: THREE.PerspectiveCamera;
	scene: THREE.Scene;

	constructor(public renderer: THREE.WebGLRenderer) {
		this.mrt = new THREE.WebGLMultipleRenderTargets(window.innerWidth, window.innerHeight, 4);

		this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
		this.camera.position.set(0, 0, 5);
		this.camera.position.set(0, 5, 5);
		this.camera.lookAt(0, 0, 0);

		this.scene = new THREE.Scene();

		// set filters & texture type
		for (let i = 0, il = this.mrt.texture.length; i < il; i++) {
			this.mrt.texture[i].minFilter = THREE.NearestFilter;
			this.mrt.texture[i].magFilter = THREE.NearestFilter;
			this.mrt.texture[i].type = THREE.FloatType;
			this.mrt.texture[i].format = THREE.RGBAFormat;
		}

		this.mrt.texture[0].name = 'albedo';
		this.mrt.texture[1].name = 'normal';
		this.mrt.texture[2].name = 'position';
		this.mrt.texture[3].name = 'material';

		this.textures = {
			albedo: this.mrt.texture[0],
			normal: this.mrt.texture[1],
			position: this.mrt.texture[2],
			material: this.mrt.texture[3],
		};;
	}

	render= () => {
		this.renderer.setRenderTarget(this.mrt)
		this.renderer.render(this.scene, this.camera)
	}

}
