function createSkybox() {
	var path = 'skybox/cloud/';
	var materials = [
		new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( path + 'RT.jpg' ), overdraw: true } ), // right
		new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( path + 'LF.jpg' ), overdraw: true } ), // left
		new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( path + 'UP.jpg' ), overdraw: true } ), // up
		new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( path + 'DN.jpg' ), overdraw: true } ), // down
		new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( path + 'BK.jpg' ), overdraw: true } ), // back
		new THREE.MeshBasicMaterial( { map: THREE.ImageUtils.loadTexture( path + 'FR.jpg' ), overdraw: true } )  // front

	];

	mesh = new THREE.Mesh( new THREE.CubeGeometry( 10000, 10000, 10000, 7, 7, 7 ), new THREE.MeshFaceMaterial( materials ) );
	mesh.scale.x = - 1;
	return mesh;
}