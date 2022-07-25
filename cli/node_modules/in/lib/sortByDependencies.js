/*jshint esversion:6*/
'use strict';

/**
 * This is the actual sort implementation.
 */
function sort(beans) {
    //TODO: we should actually sort first by priority if
    //      it was previously declared
    let graph = createGraph(beans);
    let stack = weightPriorityByDependencies(beans, graph, true);

    beans.map(plugin => plugin.priority = stack[plugin.id].priority);

    /*
     * Let's sort our modules based on their
     * collected weight.
     */
    beans.sort((a, b) => {
        if (a.priority < b.priority) return 1;
    });

    return beans;
}

/**
 * Provided a list of modules and their
 * dependencies, return an array containing
 * the modules ids ordered so that we can
 * load dependencies first.
 *
 * @argument {Object} graph Object containing modules
 *                          and their dependencies.
 *
 * @argument {Boolean} allowImplicit Should we create
 *                                    missing modules.
 *
 * @return {Array}  List of modules ordered by most
 *                  relied upon first.
 */
function weightPriorityByDependencies(beans, graph, allowImplicit = true) {
    /*
     * store weight for each module
     */
    let stack = {};

    /*
     * Collect all available modules.
     */
    let modules = Object.keys(graph);

    /*
     * All modules start with an
     * equal weight.
     */
    modules.forEach(id => stack[id] = { priority: 0 });

    /*
     * Collect the weight for each module
     */
    modules.forEach(id => weight(stack, id, graph[id]));

    /*
     * Our system might try to recover from
     * missing dependencies elsewhere, like
     * if we support 'global' dependencies
     * handled by require, etc.
     */
    function addMissingDependency(dependency) {
        //TODO: review how this should work exactly :P
        beans[dependency] = {
            id: dependency,
            priority: 1,
            dependencies: [],
            isLocal: false,
            //TODO: This could potentially fail.
            //How do we handle it?
            plugin: require(dependency)
        };

        graph[dependency] = [];
        stack[dependency] = 1;
    }

    function weight(stack, id, dependencies = [], i = 0) {
        if (i > 10) throw Error('Cyclical dependency found: ' + findCyclicDependencies(graph, id));

        if (!dependencies.length) return;

        dependencies.map(dependency => {
            if (!stack.hasOwnProperty(dependency)) {
                if (!allowImplicit) throw new Error('Dependency "' + dependency + '" not a module.');
                addMissingDependency(dependency);
            }

            /*
             * increase the count of the module
             * we are dependent on.
             */
            stack[dependency].priority++;

            /*
             * now, do the same for the dependency's
             * dependencies...
             */
            weight(stack, dependency, graph[dependency], ++i);
        });
    }

    /*
     * If we allow implicit and we actually
     * introduced an implicit dependency we
     * might want to re-generate our module
     * list.
     */
    if (allowImplicit) modules = Object.keys(graph);

    return stack;
}

/**
 * Just go over our graph tree and
 * figure out where it went wrong.
 */
function findCyclicDependencies(graph, identifier) {
    let stack = {};

    function find(id) {
        if (stack.hasOwnProperty(id)) return id === identifier;

        stack[id] = true;

        let found = (graph[id] || []).some(find);

        if (!found) delete stack[id];

        return found;
    }

    return find(identifier) ? Object.keys(stack).concat(identifier) : undefined;
}

/**
 * Build a structure that is easier
 * to work with.
 */
function createGraph(beans) {
    let out = {};

    beans.map(bean => {
        out[bean.id] = bean.plugin.dependencies || [];
    });

    return out;
}

module.exports = sort;
module.exports.createGraph = createGraph;
module.exports.findCyclicDependencies = findCyclicDependencies;
module.exports.weightPriorityByDependencies = weightPriorityByDependencies;