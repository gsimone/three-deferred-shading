import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './style.css';

// @ts-ignore
import gbufferVert from './shaders/gbuffer.vert';
// @ts-ignore
import gbufferFrag from './shaders/gbuffer.frag';

// @ts-ignore
import renderVert from './shaders/render.vert';
// @ts-ignore
import renderFrag from './shaders/render.frag';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import { SSAO } from './passes/ssao';

import { createLeva } from './passes/gui';

import GBuffer from './gbuffer';

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
loader.setDRACOLoader(dracoLoader);

const MATERIALS = {
	LAMBERT: 128,
	BASIC: 0	
}

type AnimationCallback = (args: {
	clock: THREE.Clock;
	camera: THREE.PerspectiveCamera;
	raycaster: THREE.Raycaster;
}) => void;

class App {
	camera: THREE.OrthographicCamera;
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;

	dpr: number = window.devicePixelRatio;
	clock: THREE.Clock;

	raycaster: THREE.Raycaster;

	constructor(public element: HTMLDivElement) {
		this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
		this.camera.position.set(0, 0, 5);

		this.scene = new THREE.Scene();
		this.clock = new THREE.Clock();
		this.raycaster = new THREE.Raycaster();

		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setAnimationLoop(this.render);

		element.appendChild(this.renderer.domElement);

		window.addEventListener('resize', this.resize);
		window.addEventListener('mousemove', this.mousemove);

		this.init();
	}

	resize = () => {
		const bb = this.element.getBoundingClientRect();
		this.renderer.setSize(bb.width, bb.height);
		// this.renderer.setPixelRatio(this.dpr);

		this.camera.updateProjectionMatrix();
	};

	mousemove = (e: MouseEvent) => {
		const bb = this.element.getBoundingClientRect();

		const x = ((e.clientX - bb.width / 2) / bb.width) * 2;
		const y = ((e.clientY - bb.height / 2) / bb.height) * 2;

		this.mouse[0] = x;
		this.mouse[1] = y;
	};

	init() {
		this.resize();
		this.clock.start();
	}

	animationCallbacks: AnimationCallback[] = [];

	animate = (callback: AnimationCallback) => {
		this.animationCallbacks.push(callback);
	};

	mouse: number[] = [0, 0];

	beforeRender = () => {
		this.raycaster.setFromCamera({ x: this.mouse[0], y: this.mouse[1] }, this.camera);

		for (let i = 0; i < this.animationCallbacks.length; i++) {
			this.animationCallbacks[i]({ clock: this.clock, camera: this.camera, raycaster: this.raycaster });
		}

		this.camera.lookAt(0, 0, 0);
	};

	render = () => {
		this.beforeRender();

		this.renderer.setRenderTarget(null);
		this.renderer.render(this.scene, this.camera);
	};

	add = (component: any) => {
		this.scene.add(component());
	};
}

const app = new App(document.querySelector<HTMLDivElement>('#app')!);

loader.load(
	'dragon.gltf',
	(gltf) => {
		{
			const gBuffer = new GBuffer(app.renderer);

			const material = new THREE.RawShaderMaterial({
				uniforms: {
					tColor: {
						value: new THREE.Color('#ff005b'),
					},
					materialId: {
						value: 128
					}
				},
				vertexShader: gbufferVert,
				fragmentShader: gbufferFrag,
				defines: {
					INSTANCED: true,
				},
				glslVersion: THREE.GLSL3,
			});

			/**
			 * DARGONS
			 */
			// @ts-ignore
			const geometry: THREE.BufferGeometry = gltf.scene.children[0].geometry;

			const dummy = new THREE.Object3D();
			const mat = material.clone();
			const count = 128
			const grid = Math.sqrt(count)/2
			const mesh = new THREE.InstancedMesh(geometry, mat, count);

			const instanceColors = [];

			let z = 0;
			for (let i = -grid; i < grid; i++) {
				for (let j = -grid; j < grid; j++) {
					dummy.position.set(i, 0, j);
					dummy.scale.setScalar(0.3);
					
					instanceColors.push( Math.random() );
					instanceColors.push( Math.random() );
					instanceColors.push( Math.random() );
					
					dummy.updateMatrix();
					mesh.setMatrixAt(z++, dummy.matrix);
				}
			}

			geometry.setAttribute( 'instanceColor', new THREE.InstancedBufferAttribute( new Float32Array( instanceColors ), 3 ) );

			mesh.instanceMatrix.needsUpdate = true;
			gBuffer.scene.add(mesh);

			{
				const material = new THREE.RawShaderMaterial({
					uniforms: {
						tColor: {
							value: new THREE.Color('#ff005b'),
						},
						materialId: {
							value: MATERIALS.LAMBERT
						}
					},
					vertexShader: gbufferVert,
					fragmentShader: gbufferFrag,
					glslVersion: THREE.GLSL3,
					defines: {
						INSTANCED: false,
					},
				});

				const mesh = new THREE.Mesh(new THREE.SphereGeometry(.5, 32, 32), material);

				mesh.position.y = 2

				gBuffer.scene.add(mesh);
			}

			/** Floor */
			{
				const material = new THREE.RawShaderMaterial({
					uniforms: {
						tColor: {
							value: new THREE.Color('#ff005b'),
						},
						materialId: {
							value: MATERIALS.BASIC
						}
					},
					vertexShader: gbufferVert,
					fragmentShader: gbufferFrag,
					glslVersion: THREE.GLSL3,
					defines: {
						INSTANCED: false,
					},
				});

				material.uniforms.tColor.value.set('#333');
				const mesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material);

				mesh.rotation.x = -Math.PI / 2;
				mesh.position.y = -0;

				gBuffer.scene.add(mesh);
			}

			const ssao = new SSAO(app.renderer, gBuffer.camera, gBuffer.textures);

			createLeva(ssao);

			const finalMaterial = new THREE.RawShaderMaterial({
				vertexShader: renderVert,
				fragmentShader: renderFrag,
				uniforms: {
					// light stuff
					tAlbedo: { value: gBuffer.textures.albedo },
					tNormal: { value: gBuffer.textures.normal },
					tWorld: { value: gBuffer.textures.position },
					tMaterial: { value: gBuffer.textures.material },
					tAmbientOcclusion: { value: ssao.finalTexture },

					lightPosition: { value: new THREE.Vector3(0, 2, 0) },
					viewPos: { value: new THREE.Vector3(0, 0, 0) },
					time: { value: 0 },
				},
				glslVersion: THREE.GLSL3,
			});

			app.add(() => new THREE.Mesh(new THREE.PlaneGeometry(2, 2), finalMaterial));

			const lightPosition = new THREE.Vector3(5, 2, 0);
			const lightPositionView = lightPosition.clone();

			const light = new THREE.Object3D();
			light.position.copy(lightPosition);
			const viewMatrix = new THREE.Matrix4();

			app.animate(({ clock }) => {
				const t = clock.getElapsedTime();
				light.position.set(Math.sin(t) * 10., 2, 0);

				viewMatrix.multiplyMatrices(gBuffer.camera.matrixWorldInverse, light.matrixWorld);

				lightPositionView.copy(light.position);
				lightPositionView.applyMatrix4(viewMatrix);

				(finalMaterial.uniforms.viewPos.value as THREE.Vector3).copy(gBuffer.camera.position);
				finalMaterial.uniforms.lightPosition.value.copy(lightPositionView);
			});

			app.animate(() => {
				gBuffer.render();
				ssao.render();
			});

			const controls = new OrbitControls(gBuffer.camera, app.renderer.domElement);
			gBuffer.camera.position.set(2.5, 2.5, 2);
			gBuffer.camera.lookAt(0, 0, 0);
			controls.update();

			app.animate(() => {
				controls.update();
			});
		}
	},
	function (xhr) {
		console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
	},
	// called when loading has errors
	function (error) {
		console.log('An error happened');
	}
);
