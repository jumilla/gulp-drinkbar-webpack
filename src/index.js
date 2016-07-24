
const PLUGIN_NAME = 'gulp-drinkbar-webpack'

import through from 'through2'
import gutil from 'gulp-util'
import webpack from 'webpack'
import path from 'path'
import assing from 'object-assign'
import MemoryFileSystem from 'memory-fs'



const defaultWebpackOptions = {
	entry: '',
	output: {
		filename: '[name].js',
	},
	plugins: [],
}



function webpackStream(options = {}) {
	if (typeof options === 'string') {
		options = {output: {filename: options}}
	}

	let destFile
	const entries = []

	const transform = function (file, encode, done) {
		const stream = this

		if (file.isNull()) {
			done()
		}
		else if (file.isStream()) {
			stream.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
			done()
		}
		else {
			if (!destFile) {
				destFile = new gutil.File({
					cwd: file.cwd,
					base: file.base,
					path: path.join(file.base, options.output ? options.output.filename : 'bundle.js')
				})
			}
			entries.push(file.path)
			done()
		}
	}

	const flush = function (done) {
		const stream = this
		const webpackOptions = assing({}, defaultWebpackOptions, {entry: entries}, options)

		try {
			const compiler = webpack(webpackOptions)

			const fs = compiler.outputFileSystem = new MemoryFileSystem()

			compiler.run((error, stats) => {
				if (error) {
					stream.emit('error', new gutil.PluginError(PLUGIN_NAME, error.message));
				}
				else {
					destFile.contents = new Buffer(fs.readFileSync(path.join(compiler.outputPath, options.output.filename), 'utf8'))

					stream.push(destFile)
				}
				done()
			})
		}
		catch (error) {
			stream.emit('error', new gutil.PluginError(PLUGIN_NAME, error.message));
			done()
		}
	}

	return through.obj(transform, flush)
}



webpackStream.babelLoader = require('babel-loader')
webpackStream.jsonLoader = require('json-loader')



module.exports = webpackStream
