/*
 * in
 * https://github.com/goliatone/in
 *
 * Copyright (c) 2015 goliatone
 * Licensed under the MIT license.
 */
/*jshint esversion:6*/
'use strict';

const extend = require('gextend');
const join = require('path').join;
const readdir = require('recursive-readdir-async');
const separator = require('path').sep;
const extname = require('path').extname;
const resolve = require('path').resolve;
const util = require('util');
const exists = util.promisify(require('fs').exists);
const isAbsolute = require('path').isAbsolute;
const VError = require('verror');

const EventEmitter = require('events');
const multimatch = require('multimatch');

const EXT_JS = '.js';

/**
 * This creates the bean objects.
 */
const _normalize = require('./normalizeArguments');

const _isDevelopment = require('./isDevelopment');

const _filterEmptyDir = require('./filter-empty-dir');

const logger = require('noop-console').logger();

const DEFAULTS = {
    logger,
    autoinitialize: true,
    basepath: process.cwd(),
    normalize: _normalize,
    afterMount: function() {},
    mountHandler: function _mount(bean, context, config = {}) {
        const plugin = bean.plugin;
        if (typeof bean.config === 'function') return bean.config(plugin, context, config);
        config = extend({}, bean.config, config);
        if (typeof config.mount === 'function') return config.mount(plugin, context, config);
        if (typeof plugin.init === 'function') return plugin.init(context, config);
        return context[bean.id] = plugin;
    },
    sortFilter: function _sortFilter(plugins) {
        function filter(a, b) {
            function p(i) {
                return i.plugin.priority === undefined ? 0 : i.plugin.priority;
            }
            return p(a) < p(b) ? -1 : 1;
        }
        return plugins.sort(filter);
    },
    readdirOpts: {
        mode: readdir.LIST,
        recursive: false,
        stats: false,
        ignoreFolders: true,
        extensions: false
    }
};

class PluginLoader {
    constructor(config) {
        config = extend({}, DEFAULTS, config);
        if (config.autoinitialize) this.init(config);
    }

    init(options = {}) {

        this.context = new EventEmitter();

        extend(this, options);
    }

    isPluginId(plugin) {
        return plugin.indexOf(separator) === -1;
    }

    normalizePath(path, basepath = this.basepath) {
        if (isAbsolute(path)) return path;
        return resolve(join(basepath, path));
    }

    /**
     * Scans `target` for files
     * @public
     * @param {String} target Plugin id or path to scan
     * @param {Object} options Options for readdir
     * @returns {Array} Array containing absolute paths to all files in target
     */
    async find(target, options = {}) {
        if (!this.isPluginId(target) && !isAbsolute(target)) {
            target = this.normalizePath(target, this.basepath);
        }

        if (!await exists(target)) {
            this.logger.warn('find failed due to ENOENT: %s', target);
            return resolve([]);
        }

        options = extend({}, this.readdirOpts, options);

        let list = await readdir.list(target, options);
        list = list.map(file => file.fullname);

        list = await _filterEmptyDir(list);

        return list;
    }

    /**
     *  Public: Apply `minimatch` patterns against `paths`,
     *  an array of paths.
     *  The default pattern is `['**', '!node_modules', '!.git']`
     *  * `paths` {Array} Array of paths
     *  * `patterns=['**', '!node_modules', '!.git']` {Array} `minimatch` patterns
     *
     * @argument {Array} paths Array of paths.
     * @argument {Array} patterns minimatch patterns
     * @return {Promise} Array containing filtered paths.
     */
    filter(paths, patterns = ['**', '!node_modules', '!.git', '!.json']) {
        return Promise.resolve(multimatch(paths, patterns));
    }

    /**
     * exclude files that match a given pattern.
     *
     * @param  {Array} paths         List of paths
     * @param  {Array}  [patterns=[]] List of patterns
     * @return {Promise}
     */
    exclude(paths, patterns = []) {

        if (!patterns || patterns.length === 0) {
            return Promise.resolve(paths);
        }

        if (typeof patterns === 'string') {
            patterns = [patterns];
        }

        /*
         * If we have a negative pattern
         * we need to ensure the first pattern
         * is a `**` match all.
         * Check for a pattern with a !
         * If found, then ensure index 0 is **
         */
        // if(!patterns.includes('**')) {
        //     patterns.unshift('**');
        // }

        //TODO: ensure we only have it at the start?

        let matched = [];
        let excluded = multimatch(paths, patterns);

        paths.forEach(p => {
            if (excluded.includes(p)) return;
            matched.push(p);
        });

        return Promise.resolve(matched);
    }

    /**
     * Collect all plugins into an array.
     *
     * @param {Array} plugins list of plugin paths
     * @param {Object} options
     * @param {Object} options.directory Base directory for plugins
     */
    load(plugins = [], options = {}) {
        options = extend({}, DEFAULTS, options);

        if (plugins.length === 0) {
            this.logger.warn('PluginLoader: no plugins provided');
        }

        //TODO: This is not used!! If we use it things break
        // let basepath = options.basepath || this.basepath;

        if (options.plugins) {
            plugins = plugins.concat(options.plugins);
        }

        let baseDir = options.directory ? this.normalizePath(options.directory, this.basepath) : this.basepath;
        plugins = this.normalize(plugins, baseDir);

        this._paths = plugins;
        this._plugins = [];

        return new Promise(async(resolve, reject) => {

            for (let i = 0; i < plugins.length; i++) {
                let bean = plugins[i];

                if (!this.isValidBeanExtension(bean.path)) {
                    return this.logger.warn('Provided bean has invalid extension', bean.path);
                }

                bean.isLocal = true;

                try {

                    /**
                     * Check in order in which is more likely
                     * to be true.
                     */
                    if (await exists(bean.path)) {
                        bean.plugin = require(bean.path);
                    } else if (await exists(`${bean.path}.js`)) {
                        bean.plugin = require(`${bean.path}.js`);
                    } else {
                        bean.plugin = require(join(this.basepath, 'node_modules', bean.path));
                        bean.isLocal = false;
                    }
                } catch (e) {
                    let msg = 'Failed to require plugin "' + bean.id + '": ' + e.message;
                    this.logger.error(msg);

                    if (_isDevelopment()) {
                        this.logger.error(e.stack);
                    }
                    reject(new VError(e, msg));
                }
                //TODO: we could have a post require hook, to add meta to each plugin?
                // bean.priority = bean.plugin.priority === undefined ? 0 : bean.plugin.priority;
                // bean.dependencies = bean.plugin.dependencies === undefined ? [] : bean.plugin.dependencies;

                this._plugins.push(bean);
            }

            this.sort(this._plugins);

            resolve(this._plugins);
        });
    }

    /**
     * Applies `sortFilter` to the passed in
     * list of plugins.
     * You can set `sortFilter` using the config
     * object.
     * The default value will sort plugins on a
     * `priority` property.
     *
     * ```js
     * function _sortFilter(a, b) {
     *     function p(i){
     *         return i.priority === undefined ? 0 : i.priority;
     *     }
     *     return p(a) < p(b) ? -1 : 1;
     * }
     * ```
     *
     * Synchronous.
     * @param  {Array} plugins List of plugins.
     * @return {Array} List of ordered plugins.
     */
    sort(plugins) {
        return this.sortFilter(plugins);
    }

    /**
     * Provided a list of loaded plugins it
     * will mount them in the provided `context`.
     *
     * It uses `mountHandler` which will do the
     * actual work.
     *
     * You can override `mountHandler` using the
     * config object.
     *
     * @param {Array} plugin List of loaded plugins.
     * @param {Object} config Configuration object.
     * @param {Object} context Passed as argument to
     *                         `mountHandler`
     * @type {Object}
     */
    mount(plugin, config = {}, context = this.context) {

        config = extend({}, {
            mountHandler: this.mountHandler,
            afterMount: this.afterMount
        }, config);

        let plugins = plugin;

        let { mountHandler } = config;

        if (!Array.isArray(plugins)) plugins = [plugin];

        return new Promise(async(resolve, reject) => {
            try {
                for (let plugin of plugins) {
                    await mountHandler(plugin, context, config)
                }

            } catch (e) {
                if (_isDevelopment()) {
                    this.logger.error(e);
                }
                reject(new VError(e, 'Error running plugin: ' + plugin.id + '\n\n' + e.message + '\n\n' + e.stack));
            }

            config.afterMount(context, config);

            resolve(context);
        });
    }

    /**
     * Mounts a directory containing plugin definition
     * files.
     *
     * It runs the following operations:
     *
     * - find
     * - filter
     * - exclude
     * - load
     * - mount
     *
     * If `options.exclude` is an array with
     * `multimatch` patterns of files to exclude.
     *
     * @param  {String} directory              Path to directory
     * @param  {Object} [options={}]
     * @param  {Object} [context=this.context]
     * @return {Promise}
     */
    mountDirectory(directory, options = {}, context = this.context) {
        if (!options.directory) options.directory = directory;
        return this.find(directory, options.find)
            .then(this.filter)
            .then(plugins => this.exclude(plugins, options.exclude))
            .then(plugins => this.load(plugins, options))
            .then(plugins => this.mount(plugins, options, context));
    }

    mountList(list, options = {}, context = this.context) {
        return this.load(list, options)
            .then(plugins => this.mount(plugins, options, context));
    }

    /**
     * Check if the path points to a valid
     * extension we can require.
     *
     * @param {String} path
     */
    isValidBeanExtension(path = '') {
        let ext = extname(path);
        /*
         * Allow files without extension
         */
        if (!ext) return true;

        /*
         * If file has extension only
         * allow js files.
         */
        return ext === EXT_JS;
    }
}

PluginLoader.DEFAULTS = DEFAULTS;


PluginLoader.normalize = _normalize;

/**
 * Expose PluginLoader
 */
module.exports = PluginLoader;