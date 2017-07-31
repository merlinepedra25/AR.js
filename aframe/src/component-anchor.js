//////////////////////////////////////////////////////////////////////////////
//		arjs-anchor
//////////////////////////////////////////////////////////////////////////////
AFRAME.registerComponent('arjs-anchor', {
	dependencies: ['arjs', 'artoolkit'],
	schema: {
		preset: {
			type: 'string',
		},
		markerhelpers : {	// IIF preset === 'area'
			type: 'boolean',
			default: false,
		},

		// controls parameters
		size: {
			type: 'number',
			default: 1
		},
		type: {
			type: 'string',
		},
		patternUrl: {
			type: 'string',
		},
		barcodeValue: {
			type: 'number'
		},
		changeMatrixMode: {
			type: 'string',
			default : 'modelViewMatrix',
		},
		minConfidence: {
			type: 'number',
			default: 0.6,
		},
	},
	init: function () {
		var _this = this

		// get arjsSystem
		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit

		//////////////////////////////////////////////////////////////////////////////
		//		Code Separator
		//////////////////////////////////////////////////////////////////////////////

		_this.initialised = false
		_this._arAnchor = null

		// honor object visibility
		if( _this.data.changeMatrixMode === 'modelViewMatrix' ){
			_this.el.object3D.visible = false
		}else if( _this.data.changeMatrixMode === 'cameraTransformMatrix' ){
 			_this.el.sceneEl.object3D.visible = false
		}else console.assert(false)



		// trick to wait until arjsSystem is initialised
		var startedAt = Date.now()
		var timerId = setInterval(function(){
			// wait until the system is initialised
			if( arjsSystem.initialised === false )	return

			clearInterval(timerId)

			//////////////////////////////////////////////////////////////////////////////
			//		update arProfile
			//////////////////////////////////////////////////////////////////////////////
			var arProfile = arjsSystem._arProfile
			
			// arProfile.changeMatrixMode('modelViewMatrix')
			arProfile.changeMatrixMode(_this.data.changeMatrixMode)

			// honor this.data.preset
			if( _this.data.preset === 'hiro' ){
				arProfile.defaultMarkerParameters.type = 'pattern'
				arProfile.defaultMarkerParameters.patternUrl = THREEx.ArToolkitContext.baseURL+'examples/marker-training/examples/pattern-files/pattern-hiro.patt'
				arProfile.defaultMarkerParameters.markersAreaEnabled = false
			}else if( _this.data.preset === 'kanji' ){
				arProfile.defaultMarkerParameters.type = 'pattern'
				arProfile.defaultMarkerParameters.patternUrl = THREEx.ArToolkitContext.baseURL+'examples/marker-training/examples/pattern-files/pattern-kanji.patt'
				arProfile.defaultMarkerParameters.markersAreaEnabled = false
			}else if( _this.data.preset === 'area' ){
				arProfile.defaultMarkerParameters.type = 'barcode'
				arProfile.defaultMarkerParameters.barcodeValue = 1001	
				arProfile.defaultMarkerParameters.markersAreaEnabled = true
			}else {
				// console.assert( this.data.preset === '', 'illegal preset value '+this.data.preset)
			}		

			//////////////////////////////////////////////////////////////////////////////
			//		create arAnchor
			//////////////////////////////////////////////////////////////////////////////
			
			var arSession = arjsSystem._arSession
			var arAnchor = _this._arAnchor = new ARjs.Anchor(arSession, arProfile.defaultMarkerParameters)

			// it is now considered initialised
			_this.initialised = true

			//////////////////////////////////////////////////////////////////////////////
			//		honor .debugUIEnabled
			//////////////////////////////////////////////////////////////////////////////
			if( arjsSystem.data.debugUIEnabled ){
				if( arAnchor.parameters.markersAreaEnabled ){
					var subMarkerHelpersVisible = false
					document.querySelector('#buttonToggleMarkerHelpers').addEventListener('click', function(){
						subMarkerHelpersVisible = subMarkerHelpersVisible ? false : true
						arAnchor.markersArea.setSubMarkersVisibility(subMarkerHelpersVisible)
					})


					document.querySelector('#buttonMarkersAreaReset').addEventListener('click', function(){
						var trackingBackend = arProfile.contextParameters.trackingBackend
						THREEx.ArMultiMarkerUtils.storeDefaultMultiMarkerFile(trackingBackend)
						location.reload()
					})

					document.querySelector('#buttonMarkersAreaLearner').addEventListener('click', function(){
						var learnerBaseURL = THREEx.ArToolkitContext.baseURL + 'examples/multi-markers/examples/learner.html'
						var trackingBackend = arProfile.contextParameters.trackingBackend
						THREEx.ArMultiMarkerUtils.navigateToLearnerPage(learnerBaseURL, trackingBackend)
					})		
				}else{
					document.querySelector('#buttonToggleMarkerHelpers').style.display = 'none'
					document.querySelector('#buttonMarkersAreaReset').style.display = 'none'
					document.querySelector('#buttonMarkersAreaLearner').style.display = 'none'
				}
			}
		}, 1000/60)
	},
	remove : function(){
	},
	update: function () {
	},
	tick: function(){
		var _this = this
		// if not yet initialised, do nothing
		if( this.initialised === false )	return

		//////////////////////////////////////////////////////////////////////////////
		//		update arAnchor
		//////////////////////////////////////////////////////////////////////////////
		var arjsSystem = this.el.sceneEl.systems.arjs || this.el.sceneEl.systems.artoolkit
		this._arAnchor.update()

		//////////////////////////////////////////////////////////////////////////////
		//		honor pose
		//////////////////////////////////////////////////////////////////////////////
		var arWorldRoot = this._arAnchor.object3d
		arWorldRoot.updateMatrixWorld(true)		
		arWorldRoot.matrixWorld.decompose(this.el.object3D.position, this.el.object3D.quaternion, this.el.object3D.scale)

		//////////////////////////////////////////////////////////////////////////////
		//		honor visibility
		//////////////////////////////////////////////////////////////////////////////
		if( _this._arAnchor.parameters.changeMatrixMode === 'modelViewMatrix' ){
			_this.el.object3D.visible = true
		}else if( _this._arAnchor.parameters.changeMatrixMode === 'cameraTransformMatrix' ){
			_this.el.sceneEl.object3D.visible = true
		}else console.assert(false)

		// TODO visibility of object doesnt work at all
		// - this._arAnchor.object3d.visible doesnt seem to be honored
		// - likely an issue from upstream

		// console.log('arWorldRoot.visible', arWorldRoot.visible)
	}
});

//////////////////////////////////////////////////////////////////////////////
//                define some primitives shortcuts
//////////////////////////////////////////////////////////////////////////////

AFRAME.registerPrimitive('a-marker', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjs-anchor': {},
	},
	mappings: {
		'type': 'arjs-anchor.type',
		'size': 'arjs-anchor.size',
		'url': 'arjs-anchor.patternUrl',
		'value': 'arjs-anchor.barcodeValue',
		'preset': 'arjs-anchor.preset',
		'minConfidence': 'arjs-anchor.minConfidence',
		'markerhelpers': 'arjs-anchor.markerhelpers',
	}
}));

AFRAME.registerPrimitive('a-marker-camera', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjs-anchor': {
			changeMatrixMode: 'cameraTransformMatrix'
		},
		'camera': {},
	},
	mappings: {
		'type': 'arjs-anchor.type',
		'size': 'arjs-anchor.size',
		'url': 'arjs-anchor.patternUrl',
		'value': 'arjs-anchor.barcodeValue',
		'preset': 'arjs-anchor.preset',
		'minConfidence': 'arjs-anchor.minConfidence',
		'markerhelpers': 'arjs-anchor.markerhelpers',
	}
}));


AFRAME.registerPrimitive('a-camera-static', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'camera': {},
	},
	mappings: {
	}
}));