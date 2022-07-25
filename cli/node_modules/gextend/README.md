# GExtend

[![Build Status](https://secure.travis-ci.org/goliatone/gextend.png)](http://travis-ci.org/goliatone/gextend)

Simple extend helper module, for Node.js and Browser.

## Getting Started

The functionality is quite simple:

```js
const DEFAULTS = {
    port: 9090,
    url: 'http://localhost'
};

function connect(options){
    let config = extend({}, DEFAULTS, options);
    console.log('Connect to %s:%s', config.url, config.port);
}

connect({
    url: 'http://127.0.0.1'
});
```

A simple pattern that I find myself using often:


```js
class MyClass {
    constructor(config){
        if(config.autoinitialize) this.init(config);
    }

    init(config){
        let attributes = ['logger', 'emitter', 'pubsub'];

        extend.only(attributes);
        extend(this, config);
        
        /**
         * This will prevent polluting the 
         * built in console object.
         */ 
        extend.unshim(this);

        /**
         * We could also collapse `unshim`
         * `only`, and `extend`
         */ 
        // extend.only(attributes).unshim(config)(this, config);
    }
}

MyClass.DEFAULTS = {
    autoinitialize: true,
    logger: extend.shim(console)
};
```

## Development
`npm install && bower install`

If you need to `sudo` the `npm` command, you can try to:

```terminal
sudo chown $(whoami) ~/.npm
sudo chown $(whoami) /usr/local/share/npm/bin
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

If you bump versions, remember to update:
- package.json
- bower.json
- component.json
- etc.


## Bower
>Bower is a package manager for the web. It offers a generic, unopinionated solution to the problem of front-end package management, while exposing the package dependency model via an API that can be consumed by a more opinionated build stack. There are no system wide dependencies, no dependencies are shared between different apps, and the dependency tree is flat.

To register gextend in the [bower](http://bower.io/) [registry](http://sindresorhus.com/bower-components/):
`bower register gextend git://github.com/goliatone/gextend.git`

Then, make sure to tag your module:

`git tag -a v0.1.0 -m "Initial release."`

And push it:

`git push --tags`


## Travis
In order to enable Travis for this specific project, you need to do so on your Travi's [profile](https://travis-ci.org/profile). Look for the entry `goliatone/gextend`, activate, and sync.


## Release History
* 2019-08-04: v0.6.0 `unshim` returns `extend` object so we can chain.
* 2019-08-04: v0.5.0 Add shim/uhshim functions to `extend` object.
* 2019-08-04: v0.4.0 Check for functions, overwrite instead of extending them.
