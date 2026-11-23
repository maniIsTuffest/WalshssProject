const canvas = document.querySelector("#tectonic-globe");
const statusText = document.querySelector("#globe-status");
const toggleButton = document.querySelector("#globe-toggle");

async function startGlobe() {
    let THREE;
    try {
        THREE = await import("https://esm.sh/three@0.160.1");
        const { OrbitControls } = await import("https://esm.sh/three@0.160.1/examples/jsm/controls/OrbitControls.js");

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
        camera.position.set(0, 0.2, 7.2);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minDistance = 5.2;
        controls.maxDistance = 9;
        controls.autoRotate = false;

        const earthTexture = createEarthTexture();
        const earth = new THREE.Mesh(
            new THREE.SphereGeometry(2, 64, 64),
            new THREE.MeshPhongMaterial({
                map: earthTexture,
                shininess: 12,
                specular: new THREE.Color(0x446d83)
            })
        );
        scene.add(earth);

        scene.add(new THREE.AmbientLight(0x9fc6dd, 0.5));
        const sun = new THREE.DirectionalLight(0xfff1c7, 3);
        sun.position.set(5, 3, 6);
        scene.add(sun);

        addStars(scene, THREE);

        let paused = false;
        toggleButton.addEventListener("click", () => {
            paused = !paused;
            toggleButton.setAttribute("aria-pressed", String(paused));
            toggleButton.textContent = paused ? "Resume rotation" : "Pause rotation";
        });

        function resize() {
            const rect = canvas.getBoundingClientRect();
            renderer.setSize(rect.width, rect.height, false);
            camera.aspect = rect.width / rect.height;
            camera.updateProjectionMatrix();
        }

        window.addEventListener("resize", resize);
        resize();
        statusText.classList.add("hidden");

        const clock = new THREE.Clock();
        function animate() {
            const delta = clock.getDelta();
            if (!paused) {
                earth.rotation.y += delta * 0.06;
            }
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        animate();
    } catch (error) {
        statusText.textContent = "3D globe unavailable. Check your internet connection.";
        console.error(error);
    }

    function createEarthTexture() {
        const texture = new THREE.TextureLoader().load("tectonicMap.jpeg");
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    function latLonToVector(lat, lon, radius = 2.06) {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        return new THREE.Vector3(
            -radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    function addStars(scene, THREE) {
        const positions = [];
        for (let i = 0; i < 320; i++) {
            const radius = 12 + Math.random() * 12;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            positions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta)
            );
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        scene.add(new THREE.Points(
            geometry,
            new THREE.PointsMaterial({ color: 0xb8e1ef, size: 0.035, transparent: true, opacity: 0.7 })
        ));
    }
}

startGlobe();
