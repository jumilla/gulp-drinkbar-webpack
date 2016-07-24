'use strict';

var _through = require('through2');

var _through2 = _interopRequireDefault(_through);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _webpack = require('webpack');

var _webpack2 = _interopRequireDefault(_webpack);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _objectAssign = require('object-assign');

var _objectAssign2 = _interopRequireDefault(_objectAssign);

var _memoryFs = require('memory-fs');

var _memoryFs2 = _interopRequireDefault(_memoryFs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PLUGIN_NAME = 'gulp-drinkbar-webpack';

var defaultWebpackOptions = {
	entry: '',
	output: {
		filename: '[name].js'
	},
	plugins: []
};

function webpackStream() {
	var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

	if (typeof options === 'string') {
		options = { output: { filename: options } };
	}

	var destFile = void 0;
	var entries = [];

	var transform = function transform(file, encode, done) {
		var stream = this;

		if (file.isNull()) {
			done();
		} else if (file.isStream()) {
			stream.emit('error', new _gulpUtil2.default.PluginError(PLUGIN_NAME, 'Streaming not supported'));
			done();
		} else {
			if (!destFile) {
				destFile = new _gulpUtil2.default.File({
					cwd: file.cwd,
					base: file.base,
					path: _path2.default.join(file.base, options.output ? options.output.filename : 'bundle.js')
				});
			}
			entries.push(file.path);
			done();
		}
	};

	var flush = function flush(done) {
		var stream = this;
		var webpackOptions = (0, _objectAssign2.default)({}, defaultWebpackOptions, { entry: entries }, options);

		try {
			(function () {
				var compiler = (0, _webpack2.default)(webpackOptions);

				var fs = compiler.outputFileSystem = new _memoryFs2.default();

				compiler.run(function (error, stats) {
					if (error) {
						stream.emit('error', new _gulpUtil2.default.PluginError(PLUGIN_NAME, error.message));
					} else {
						destFile.contents = new Buffer(fs.readFileSync(_path2.default.join(compiler.outputPath, options.output.filename), 'utf8'));

						stream.push(destFile);
					}
					done();
				});
			})();
		} catch (error) {
			stream.emit('error', new _gulpUtil2.default.PluginError(PLUGIN_NAME, error.message));
			done();
		}
	};

	return _through2.default.obj(transform, flush);
}

webpackStream.babelLoader = require('babel-loader');
webpackStream.jsonLoader = require('json-loader');

module.exports = webpackStream;