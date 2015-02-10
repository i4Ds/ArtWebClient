/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function (camera) {

    var scope = this;

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);
	//camera.position.set(0, 0, 50);

    var yawObject = new THREE.Object3D();
    yawObject.position.x = -11.4;
    yawObject.position.y = 5;
    yawObject.position.z = -5.5;
	yawObject.rotation.y = 4;//Math.PI * 1.25;
    yawObject.add(pitchObject);

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;

    var velocity = new THREE.Vector3();
	var speed = 1.0;

    var PI_2 = Math.PI / 2;

    var onMouseMove = function (event) {

        if (scope.enabled === false) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		/*
		camera.position.x = 15 * Math.cos( theta );
		camera.position.y = 10;
		camera.position.z = 15 * Math.sin( theta );

		camera.lookAt( scene.position );*/
		
        yawObject.rotation.y -= movementX * 0.001;
        pitchObject.rotation.x -= movementY * 0.001;

        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
		
		
    };

    var onKeyDown = function (event) {
        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = true;
                break;

            case 37: // left
            case 65: // a
                moveLeft = true;
				break;

            case 40: // down
            case 83: // s
                moveBackward = true;
                break;

            case 39: // right
            case 68: // d
                moveRight = true;
                break;

        }

    };

    var onKeyUp = function (event) {
        switch (event.keyCode) {

            case 38: // up
            case 87: // w
                moveForward = false;
                break;

            case 37: // left
            case 65: // a
                moveLeft = false;
                break;

            case 40: // down
            case 83: // a
                moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                moveRight = false;
                break;

        }

    };

	this.fireKeyUp = function(keyCode) {
		onKeyUp({ keyCode: keyCode });
	};
	
	this.fireKeyDown = function(keyCode) {
		onKeyDown({ keyCode: keyCode });
	};
	
	this.setSpeed = function(speedModifier) {
		speed = speedModifier;
	};
	
	this.getVelocityFactor = function() {
		return velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z;
	};
	
	this.setMoveForward = function(forward) {
		moveForward = forward;
		if (Detector.istouchenabled) velocity.x = velocity.y = velocity.z = 0;
	};
	
	this.forwardMouseMove = function(event) {
		onMouseMove(event);
	};

	this.bindEvents = function() {
		console.log('rebind');
		document.removeEventListener('mousemove', onMouseMove, false);
		document.removeEventListener('keydown', onKeyDown, false);
		document.removeEventListener('keyup', onKeyUp, false);
		document.addEventListener('mousemove', onMouseMove, false);
		document.addEventListener('keydown', onKeyDown, false);
		document.addEventListener('keyup', onKeyUp, false);
	};
	
	if (!Detector.istouchenabled) {
		this.bindEvents();
	}
	//otherwise we'll use "forwardMouseMove"
	
    this.enabled = false;

    this.getObject = function () {

        return yawObject;

    };
	
	//stopping i.e. the slow after movement needs to be more responsive on mobiles 'cause the update isn't called as often
	this.mobileBreaksAdjustment = 3;

	var breaksModifier = 0;
    this.update = function (delta) {

        if (scope.enabled === false) return;

        delta *= 0.1;
		
		//substract previous step multiplied by current velocity to get a smooth start and end, and not an abrupt one.
		breaksModifier = Math.min(0.08 * delta * Math.abs(speed) * this.mobileBreaksAdjustment, 1.0);
        velocity.x += (-velocity.x) * breaksModifier;
        velocity.z += (-velocity.z) * breaksModifier;
        velocity.y += (-velocity.y) * breaksModifier;
		
        if (moveForward) {
            velocity.z -= 0.08 * delta * speed;
            velocity.y += 0.08 * delta * speed;
        }
        if (moveBackward) {
            velocity.z += 0.08 * delta * speed;
            velocity.y -= 0.08 * delta * speed;
        }

        if (moveLeft) velocity.x -= 0.08 * delta * speed;
        if (moveRight) velocity.x += 0.08 * delta * speed;

        yawObject.translateX(velocity.x);
        yawObject.translateY(velocity.y * Math.sin(pitchObject.rotation.x));
        yawObject.translateZ(velocity.z * Math.cos(pitchObject.rotation.x));
    };

};
