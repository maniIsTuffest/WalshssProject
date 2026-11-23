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
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.55;

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

        scene.add(new THREE.AmbientLight(0x9fc6dd, 1.4));
        const sun = new THREE.DirectionalLight(0xfff1c7, 2.7);
        sun.position.set(5, 3, 6);
        scene.add(sun);

        addStars(scene, THREE);
        addPlateBoundaries(scene, THREE);
        addLandformMarkers(scene, THREE);

        let paused = false;
        toggleButton.addEventListener("click", () => {
            paused = !paused;
            controls.autoRotate = !paused;
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

        function animate() {
            controls.update();
            earth.rotation.y = 0;
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

    function addPlateBoundaries(scene, THREE) {
        const boundaryTypes = [
            { color: 0xffdc55, paths: [
                [[72,-35],[68,-20],[58,-12],[48,-8],[30,-20],[12,-32],[0,-15],[-20,-20],[-45,-10],[-55,10]],
                [[63,-30],[55,-25],[42,-25],[28,-33],[15,-25],[5,-18]],
                [[-5,-110],[5,-105],[12,-100],[18,-95],[22,-85]]
            ]},
            { color: 0xff6b67, paths: [
                [[50,155],[38,145],[26,130],[15,120],[8,105],[-7,110],[-12,125]],
                [[35,-122],[25,-115],[15,-105],[10,-90]],
                [[-20,-75],[-30,-72],[-45,-68]],
                [[15,60],[5,80],[-5,95],[-15,110]],
                [[40,-30],[35,-20],[25,-30],[12,-20]]
            ]},
            { color: 0x69dfc6, paths: [
                [[38,-122],[32,-118],[28,-112],[20,-110],[15,-105]],
                [[38,-30],[30,-42],[20,-48],[10,-50]],
                [[-34,-70],[-38,-75],[-42,-72]]
            ]}
        ];

        boundaryTypes.forEach(type => {
            type.paths.forEach(path => {
                const positions = path.map(([lat, lon]) => latLonToVector(lat, lon));
                const geometry = new THREE.BufferGeometry().setFromPoints(positions);
                const line = new THREE.Line(
                    geometry,
                    new THREE.LineBasicMaterial({ color: type.color, transparent: true, opacity: 0.95 })
                );
                scene.add(line);
            });
        });
    }

    function addLandformMarkers(scene, THREE) {
        const places = [
            [64.9631, -19.0208, 0xffdc55],
            [11.35, 142.2, 0xff6b67],
            [19.4069, -155.2834, 0xffa24d],
            [27.9881, 86.925, 0xffffff]
        ];
        places.forEach(([lat, lon, color]) => {
            const marker = new THREE.Mesh(
                new THREE.SphereGeometry(0.055, 16, 16),
                new THREE.MeshBasicMaterial({ color })
            );
            marker.position.copy(latLonToVector(lat, lon, 2.09));
            scene.add(marker);
        });
    }
}

startGlobe();
