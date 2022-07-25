'use strict';
const join = require('path').join;
const util = require('util');
const exists = util.promisify(require('fs').exists);
const lstat = util.promisify(require('fs').lstat);

/**
 * We want to filter out directories that
 * are not able to be required, that is
 * directories that do not have an index.js
 * file.
 * 
 * @param  {Array} list List of filepaths
 * @param {String} [entryFile=index.js] Default module entry point 
 * @return {Array}
 */
async function filterEmptyDir(list = [], entryFile = 'index.js') {
    let dir, stat, isMod;

    let out = [],
        total = list.length;

    for (let i = 0; i < total; i++) {
        dir = list[i];
        stat = await lstat(dir);
        isMod = await exists(join(dir, entryFile));

        if (!stat.isDirectory()) out.push(dir);
        else if (isMod) out.push(dir);
        else out.push(false);
    }

    return out.filter(Boolean);
}

module.exports = filterEmptyDir;