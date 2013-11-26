Refuel = {
	config: {
		basePath: '/refueljs/',
		requireFilePath: '/refueljs/lib/require.min.js',
		waitSeconds: 200,
		skipDataMain: true,
		deps: ['Modernizr', 'Path', 'Hammer','polyfills'],
		paths: {
			'Modernizr': '//cdnjs.cloudflare.com/ajax/libs/modernizr/2.6.2/modernizr.min',
			'Path': '/refueljs/lib/path.min',
			'Hammer': '/refueljs/lib/hammer.min',
			'polyfills': '/refueljs/lib/polyfills.min'
		},
		shim: {
			'Detectizr': {
				deps: ['Modernizr']
			}
		},
		autoObserve: true
	}
};