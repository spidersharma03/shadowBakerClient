import * as Pixotronics from "shadowbaker";
import {GUI} from "dat.gui";

export class ShadowBakerTest {
    constructor() {
        this.init();

        this.initGUI();
        
        this.animate = this.animate.bind(this);

        this.animate();
    }

    resetCamera(node) {
        const center = new THREE.Vector3();
        const box = new THREE.Box3();
        if(node) {
            box.setFromObject(node);
        }
        box.getCenter(center);
        
        const size = new THREE.Vector3();
        box.getSize(size);
        this.camera.position.set(center.x, center.y + size.y, 3 * size.z + center.z);
        this.controls.target.set(center.x, center.y, center.z);
        this.controls.update();
    }
    
    initGUI() {
        const settings = {
            "solidAngle" : 45,
            "brightness" : 0.1,
            "blurRadius": 0.5,
            "falloff": 1.5,
            "enableBlur": true,
            "smoothTransition": false,
            "numSamples": 500,
            "numSamplesPerFrame": 2,
            "height": 0,
            "shadowMapResolutionLevel": 6,
            "sides": 2,
        }
        const panel = new GUI( { width: 310 } );
        panel.add(settings, 'solidAngle', 1, 90, 0.05).onChange( (value) => {
            this.shadowBaker.setLightSolidAngle(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'brightness', 0, 1, 0.005).onChange( (value) => {
            this.shadowBaker.setBrightness(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'blurRadius', 0., 2, 0.005).onChange( (value) => {
            this.shadowBaker.setBlurRadius(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'falloff', 1., 5, 0.005).onChange( (value) => {
            this.shadowBaker.setFalloff(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'numSamples', 10, 4000, 1).onChange( (value) => {
            this.shadowBaker.setNumSamples(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'numSamplesPerFrame', 1, 50, 1).onChange( (value) => {
            this.shadowBaker.setNumSamplesPerFrame(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'smoothTransition').onChange( (value) => {
            this.shadowBaker.setSmoothTransition(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'height', 0, 2, 0.01).onChange( (value) => {
            this.shadowBaker.setDistanceOffset(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'enableBlur').onChange( (value) => {
            this.shadowBaker.setEnableSmooth(value);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add(settings, 'shadowMapResolutionLevel', 0, 6, 1).onChange( (value) => {
            const resolution = 16 * Math.pow(2, value);
            this.shadowBaker.setShadowMapResolution(resolution);
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });
        panel.add( settings, 'sides', {UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4, FRONT: 5, BACK: 6} ).onChange( (value) => {
            this.shadowBaker.setSide(Number(value));
            this.shadowBaker.startBake(this.renderer, this.scene, this.camera, this.renderTarget);
        });

        panel.open();
    }

    init() {

        this.shadowBaker = new Pixotronics.ShadowBaker({
            numSamples: 500, numSamplesPerFrame: 2,
            size: 1.3, brightness: 0.1,
            enableBlur: true, blurRadius: 0.5,
            falloff: 1.5,
            smoothTransition: false,
            useMovingAverage: false,
            side: Pixotronics.ShadowBaker.ShadowSide.DOWN
        });

        let container = document.createElement('div');
        document.body.appendChild(container);

        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20);
        this.camera.position.set(-1.8, 0.9, 2.7);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        
        this.dirLight = new THREE.DirectionalLight(0xffffff);
        this.dirLight.position.set(0, 2, -2);
        this.dirLight.visible = true;
        this.dirLight.intensity = 1;
        this.scene.add(this.dirLight);
        
        // model
        const manager = new THREE.LoadingManager();
        manager.onStart = function (url, itemsLoaded, itemsTotal) {
            console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        };

        manager.onLoad = function () {
            console.log('Loading complete!');
        };


        manager.onProgress = function (url, itemsLoaded, itemsTotal) {
            console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
        };

        manager.onError = function (url) {
            console.log('There was an error loading ' + url);
        };

        const loader = new THREE.GLTFLoader(manager);
        loader.load(
            'models/gltf/Duck.gltf',
            (gltf) => {
                gltf.scene.traverse(function (child) {
                    if (child.isMesh) {
                        child.material.needsUpdate = true;
                        child.material.roughness = 1;
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(gltf.scene);
                this.resetCamera(gltf.scene);
                
                const params = {
                    format: THREE.RGBAFormat,
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter
                };
                this.renderTarget = new THREE.WebGLRenderTarget(512, 512, params);

                const shadowPlaneMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    map: this.renderTarget
                })
                const shadowPlane = new THREE.Mesh(
                    new THREE.PlaneBufferGeometry(1, 1),
                    shadowPlaneMaterial
                );

                const updateShadowPlane = () => {
                    const position = new THREE.Vector3();
                    const quaternion = new THREE.Quaternion();
                    const scale = new THREE.Vector3();

                    this.shadowBaker.getShadowPlaneTransform(position, quaternion, scale);
                    shadowPlane.position.copy(position);
                    shadowPlane.quaternion.copy(quaternion);
                    shadowPlane.scale.copy(scale);
                    shadowPlane.material.needsUpdate = true;
                    shadowPlane.updateMatrixWorld();
                }

                const onStart = () => {
                    updateShadowPlane();
                }

                const onComplete = () => {
                    this.scene.add(shadowPlane);
                };

                this.shadowBaker.onBeforeStart(onStart);
                this.shadowBaker.onComplete(onComplete);

                this.shadowBaker.onProgress( progress => {
                    console.log("Baker::Shadow Baking " + progress * 100 + "% complete");
                });
                this.shadowBaker.startBake(this.renderer, gltf.scene, this.camera, this.renderTarget);
            });

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.gammaOutput = true;
        this.renderer.gammaInput = true;
        container.appendChild(this.renderer.domElement);

        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    onWindowResize() {

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    updateDirLight() {
        let dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        dir.multiplyScalar(-3);
        this.dirLight.position.copy(dir);
    }
    
    animate() {

        this.renderer.render(this.scene, this.camera);

        this.updateDirLight();

        requestAnimationFrame(this.animate);
    }

}