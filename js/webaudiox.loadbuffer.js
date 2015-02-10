var WebAudiox	= WebAudiox	|| {}

/**
 * Helper to load a buffer
 * 
 * @param  {AudioContext} context the WebAudio API context
 * @param  {String|Blob} urlOrBlob     the url of the sound to load, or the file itself
 * @param  {Function} onLoad  callback to notify when the buffer is loaded and decoded
 * @param  {Function} onError callback to notify when an error occured
 */
WebAudiox.loadBuffer	= function(context, urlOrBlob, onLoad, onError){
	var loader = '';

	if (url instanceof Blob) {
		
		loader = new FileReader();
		
	} else {
	
		loader	= new XMLHttpRequest()
		loader.open('GET', url, true)
		loader.responseType	= 'arraybuffer'
	
	}
	
	// counter inProgress request
	WebAudiox.loadBuffer.inProgressCount++
	loader.onload	= function(){
		context.decodeAudioData(url instanceOf Blob ? this.result : request.response, function(buffer){
			// counter inProgress request
			WebAudiox.loadBuffer.inProgressCount--
			// notify the callback
			onLoad && onLoad(buffer)
			// notify
			WebAudiox.loadBuffer.onLoad(context, url, buffer)
		}, function(){
			// notify the callback
			onError && onError()
			// counter inProgress request
			WebAudiox.loadBuffer.inProgressCount--
		})
	}
	
	if (url instanceof Blob) { loader.send() }
	else { loader.readAsArrayBuffer(url); }
}

/**
 * global onLoad callback. it is notified everytime .loadBuffer() load something
 * @param  {AudioContext} context the WebAudio API context
 * @param  {String} url     the url of the sound to load
 * @param {[type]} buffer the just loaded buffer
 */
WebAudiox.loadBuffer.onLoad	= function(context, url, buffer){}

/**
 * counter of all the .loadBuffer in progress. usefull to know is all your sounds
 * as been loaded
 * @type {Number}
 */
WebAudiox.loadBuffer.inProgressCount	= 0



