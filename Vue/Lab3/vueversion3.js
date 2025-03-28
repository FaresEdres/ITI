var Vue = (function (exports) {
    'use strict';

    /**
     * Make a map and return a function for checking if a key
     * is in that map.
     * IMPORTANT: all calls of this function must be prefixed with
     * \/\*#\_\_PURE\_\_\*\/
     * So that rollup can tree-shake them if necessary.
     */
    function makeMap(str, expectsLowerCase) {
        const map = Object.create(null);
        const list = str.split(',');
        for (let i = 0; i < list.length; i++) {
            map[list[i]] = true;
        }
        return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
    }

    /**
     * dev only flag -> name mapping
     */
    const PatchFlagNames = {
        [1 /* TEXT */]: `TEXT`,
        [2 /* CLASS */]: `CLASS`,
        [4 /* STYLE */]: `STYLE`,
        [8 /* PROPS */]: `PROPS`,
        [16 /* FULL_PROPS */]: `FULL_PROPS`,
        [32 /* HYDRATE_EVENTS */]: `HYDRATE_EVENTS`,
        [64 /* STABLE_FRAGMENT */]: `STABLE_FRAGMENT`,
        [128 /* KEYED_FRAGMENT */]: `KEYED_FRAGMENT`,
        [256 /* UNKEYED_FRAGMENT */]: `UNKEYED_FRAGMENT`,
        [512 /* NEED_PATCH */]: `NEED_PATCH`,
        [1024 /* DYNAMIC_SLOTS */]: `DYNAMIC_SLOTS`,
        [2048 /* DEV_ROOT_FRAGMENT */]: `DEV_ROOT_FRAGMENT`,
        [-1 /* HOISTED */]: `HOISTED`,
        [-2 /* BAIL */]: `BAIL`
    };

    /**
     * Dev only
     */
    const slotFlagsText = {
        [1 /* STABLE */]: 'STABLE',
        [2 /* DYNAMIC */]: 'DYNAMIC',
        [3 /* FORWARDED */]: 'FORWARDED'
    };

    const GLOBALS_WHITE_LISTED = 'Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
        'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
        'Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt';
    const isGloballyWhitelisted = /*#__PURE__*/ makeMap(GLOBALS_WHITE_LISTED);

    const range = 2;
    function generateCodeFrame(source, start = 0, end = source.length) {
        const lines = source.split(/\r?\n/);
        let count = 0;
        const res = [];
        for (let i = 0; i < lines.length; i++) {
            count += lines[i].length + 1;
            if (count >= start) {
                for (let j = i - range; j <= i + range || end > count; j++) {
                    if (j < 0 || j >= lines.length)
                        continue;
                    const line = j + 1;
                    res.push(`${line}${' '.repeat(Math.max(3 - String(line).length, 0))}|  ${lines[j]}`);
                    const lineLength = lines[j].length;
                    if (j === i) {
                        // push underline
                        const pad = start - (count - lineLength) + 1;
                        const length = Math.max(1, end > count ? lineLength - pad : end - start);
                        res.push(`   |  ` + ' '.repeat(pad) + '^'.repeat(length));
                    }
                    else if (j > i) {
                        if (end > count) {
                            const length = Math.max(Math.min(end - count, lineLength), 1);
                            res.push(`   |  ` + '^'.repeat(length));
                        }
                        count += lineLength + 1;
                    }
                }
                break;
            }
        }
        return res.join('\n');
    }

    /**
     * On the client we only need to offer special cases for boolean attributes that
     * have different names from their corresponding dom properties:
     * - itemscope -> N/A
     * - allowfullscreen -> allowFullscreen
     * - formnovalidate -> formNoValidate
     * - ismap -> isMap
     * - nomodule -> noModule
     * - novalidate -> noValidate
     * - readonly -> readOnly
     */
    const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
    const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs);

    function normalizeStyle(value) {
        if (isArray(value)) {
            const res = {};
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const normalized = normalizeStyle(isString(item) ? parseStringStyle(item) : item);
                if (normalized) {
                    for (const key in normalized) {
                        res[key] = normalized[key];
                    }
                }
            }
            return res;
        }
        else if (isObject(value)) {
            return value;
        }
    }
    const listDelimiterRE = /;(?![^(]*\))/g;
    const propertyDelimiterRE = /:(.+)/;
    function parseStringStyle(cssText) {
        const ret = {};
        cssText.split(listDelimiterRE).forEach(item => {
            if (item) {
                const tmp = item.split(propertyDelimiterRE);
                tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
            }
        });
        return ret;
    }
    function normalizeClass(value) {
        let res = '';
        if (isString(value)) {
            res = value;
        }
        else if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const normalized = normalizeClass(value[i]);
                if (normalized) {
                    res += normalized + ' ';
                }
            }
        }
        else if (isObject(value)) {
            for (const name in value) {
                if (value[name]) {
                    res += name + ' ';
                }
            }
        }
        return res.trim();
    }

    // These tag configs are shared between compiler-dom and runtime-dom, so they
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element
    const HTML_TAGS = 'html,body,base,head,link,meta,style,title,address,article,aside,footer,' +
        'header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,div,dd,dl,dt,figcaption,' +
        'figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,' +
        'data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,s,samp,small,span,strong,sub,sup,' +
        'time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,' +
        'canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,' +
        'th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,' +
        'option,output,progress,select,textarea,details,dialog,menu,' +
        'summary,template,blockquote,iframe,tfoot';
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Element
    const SVG_TAGS = 'svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,' +
        'defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,' +
        'feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,' +
        'feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,' +
        'feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,' +
        'fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,' +
        'foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,' +
        'mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,' +
        'polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,' +
        'text,textPath,title,tspan,unknown,use,view';
    const VOID_TAGS = 'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr';
    const isHTMLTag = /*#__PURE__*/ makeMap(HTML_TAGS);
    const isSVGTag = /*#__PURE__*/ makeMap(SVG_TAGS);
    const isVoidTag = /*#__PURE__*/ makeMap(VOID_TAGS);

    function looseCompareArrays(a, b) {
        if (a.length !== b.length)
            return false;
        let equal = true;
        for (let i = 0; equal && i < a.length; i++) {
            equal = looseEqual(a[i], b[i]);
        }
        return equal;
    }
    function looseEqual(a, b) {
        if (a === b)
            return true;
        let aValidType = isDate(a);
        let bValidType = isDate(b);
        if (aValidType || bValidType) {
            return aValidType && bValidType ? a.getTime() === b.getTime() : false;
        }
        aValidType = isArray(a);
        bValidType = isArray(b);
        if (aValidType || bValidType) {
            return aValidType && bValidType ? looseCompareArrays(a, b) : false;
        }
        aValidType = isObject(a);
        bValidType = isObject(b);
        if (aValidType || bValidType) {
            /* istanbul ignore if: this if will probably never be called */
            if (!aValidType || !bValidType) {
                return false;
            }
            const aKeysCount = Object.keys(a).length;
            const bKeysCount = Object.keys(b).length;
            if (aKeysCount !== bKeysCount) {
                return false;
            }
            for (const key in a) {
                const aHasKey = a.hasOwnProperty(key);
                const bHasKey = b.hasOwnProperty(key);
                if ((aHasKey && !bHasKey) ||
                    (!aHasKey && bHasKey) ||
                    !looseEqual(a[key], b[key])) {
                    return false;
                }
            }
        }
        return String(a) === String(b);
    }
    function looseIndexOf(arr, val) {
        return arr.findIndex(item => looseEqual(item, val));
    }

    /**
     * For converting {{ interpolation }} values to displayed strings.
     * @private
     */
    const toDisplayString = (val) => {
        return val == null
            ? ''
            : isObject(val)
                ? JSON.stringify(val, replacer, 2)
                : String(val);
    };
    const replacer = (_key, val) => {
        if (isMap(val)) {
            return {
                [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val]) => {
                    entries[`${key} =>`] = val;
                    return entries;
                }, {})
            };
        }
        else if (isSet(val)) {
            return {
                [`Set(${val.size})`]: [...val.values()]
            };
        }
        else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
            return String(val);
        }
        return val;
    };

    const EMPTY_OBJ = Object.freeze({})
        ;
    const EMPTY_ARR = Object.freeze([]);
    const NOOP = () => { };
    /**
     * Always return false.
     */
    const NO = () => false;
    const onRE = /^on[^a-z]/;
    const isOn = (key) => onRE.test(key);
    const isModelListener = (key) => key.startsWith('onUpdate:');
    const extend = Object.assign;
    const remove = (arr, el) => {
        const i = arr.indexOf(el);
        if (i > -1) {
            arr.splice(i, 1);
        }
    };
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    const isArray = Array.isArray;
    const isMap = (val) => toTypeString(val) === '[object Map]';
    const isSet = (val) => toTypeString(val) === '[object Set]';
    const isDate = (val) => val instanceof Date;
    const isFunction = (val) => typeof val === 'function';
    const isString = (val) => typeof val === 'string';
    const isSymbol = (val) => typeof val === 'symbol';
    const isObject = (val) => val !== null && typeof val === 'object';
    const isPromise = (val) => {
        return isObject(val) && isFunction(val.then) && isFunction(val.catch);
    };
    const objectToString = Object.prototype.toString;
    const toTypeString = (value) => objectToString.call(value);
    const toRawType = (value) => {
        // extract "RawType" from strings like "[object RawType]"
        return toTypeString(value).slice(8, -1);
    };
    const isPlainObject = (val) => toTypeString(val) === '[object Object]';
    const isIntegerKey = (key) => isString(key) &&
        key !== 'NaN' &&
        key[0] !== '-' &&
        '' + parseInt(key, 10) === key;
    const isReservedProp = /*#__PURE__*/ makeMap(
        // the leading comma is intentional so empty string "" is also included
        ',key,ref,' +
        'onVnodeBeforeMount,onVnodeMounted,' +
        'onVnodeBeforeUpdate,onVnodeUpdated,' +
        'onVnodeBeforeUnmount,onVnodeUnmounted');
    const cacheStringFunction = (fn) => {
        const cache = Object.create(null);
        return ((str) => {
            const hit = cache[str];
            return hit || (cache[str] = fn(str));
        });
    };
    const camelizeRE = /-(\w)/g;
    /**
     * @private
     */
    const camelize = cacheStringFunction((str) => {
        return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
    });
    const hyphenateRE = /\B([A-Z])/g;
    /**
     * @private
     */
    const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase());
    /**
     * @private
     */
    const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
    /**
     * @private
     */
    const toHandlerKey = cacheStringFunction((str) => (str ? `on${capitalize(str)}` : ``));
    // compare whether a value has changed, accounting for NaN.
    const hasChanged = (value, oldValue) => value !== oldValue && (value === value || oldValue === oldValue);
    const invokeArrayFns = (fns, arg) => {
        for (let i = 0; i < fns.length; i++) {
            fns[i](arg);
        }
    };
    const def = (obj, key, value) => {
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: false,
            value
        });
    };
    const toNumber = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? val : n;
    };
    let _globalThis;
    const getGlobalThis = () => {
        return (_globalThis ||
            (_globalThis =
                typeof globalThis !== 'undefined'
                    ? globalThis
                    : typeof self !== 'undefined'
                        ? self
                        : typeof window !== 'undefined'
                            ? window
                            : typeof global !== 'undefined'
                                ? global
                                : {}));
    };

    const targetMap = new WeakMap();
    const effectStack = [];
    let activeEffect;
    const ITERATE_KEY = Symbol('iterate');
    const MAP_KEY_ITERATE_KEY = Symbol('Map key iterate');
    function isEffect(fn) {
        return fn && fn._isEffect === true;
    }
    function effect(fn, options = EMPTY_OBJ) {
        if (isEffect(fn)) {
            fn = fn.raw;
        }
        const effect = createReactiveEffect(fn, options);
        if (!options.lazy) {
            effect();
        }
        return effect;
    }
    function stop(effect) {
        if (effect.active) {
            cleanup(effect);
            if (effect.options.onStop) {
                effect.options.onStop();
            }
            effect.active = false;
        }
    }
    let uid = 0;
    function createReactiveEffect(fn, options) {
        const effect = function reactiveEffect() {
            if (!effect.active) {
                return options.scheduler ? undefined : fn();
            }
            if (!effectStack.includes(effect)) {
                cleanup(effect);
                try {
                    enableTracking();
                    effectStack.push(effect);
                    activeEffect = effect;
                    return fn();
                }
                finally {
                    effectStack.pop();
                    resetTracking();
                    activeEffect = effectStack[effectStack.length - 1];
                }
            }
        };
        effect.id = uid++;
        effect.allowRecurse = !!options.allowRecurse;
        effect._isEffect = true;
        effect.active = true;
        effect.raw = fn;
        effect.deps = [];
        effect.options = options;
        return effect;
    }
    function cleanup(effect) {
        const { deps } = effect;
        if (deps.length) {
            for (let i = 0; i < deps.length; i++) {
                deps[i].delete(effect);
            }
            deps.length = 0;
        }
    }
    let shouldTrack = true;
    const trackStack = [];
    function pauseTracking() {
        trackStack.push(shouldTrack);
        shouldTrack = false;
    }
    function enableTracking() {
        trackStack.push(shouldTrack);
        shouldTrack = true;
    }
    function resetTracking() {
        const last = trackStack.pop();
        shouldTrack = last === undefined ? true : last;
    }
    function track(target, type, key) {
        if (!shouldTrack || activeEffect === undefined) {
            return;
        }
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map()));
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, (dep = new Set()));
        }
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
            activeEffect.deps.push(dep);
            if (activeEffect.options.onTrack) {
                activeEffect.options.onTrack({
                    effect: activeEffect,
                    target,
                    type,
                    key
                });
            }
        }
    }
    function trigger(target, type, key, newValue, oldValue, oldTarget) {
        const depsMap = targetMap.get(target);
        if (!depsMap) {
            // never been tracked
            return;
        }
        const effects = new Set();
        const add = (effectsToAdd) => {
            if (effectsToAdd) {
                effectsToAdd.forEach(effect => {
                    if (effect !== activeEffect || effect.allowRecurse) {
                        effects.add(effect);
                    }
                });
            }
        };
        if (type === "clear" /* CLEAR */) {
            // collection being cleared
            // trigger all effects for target
            depsMap.forEach(add);
        }
        else if (key === 'length' && isArray(target)) {
            depsMap.forEach((dep, key) => {
                if (key === 'length' || key >= newValue) {
                    add(dep);
                }
            });
        }
        else {
            // schedule runs for SET | ADD | DELETE
            if (key !== void 0) {
                add(depsMap.get(key));
            }
            // also run for iteration key on ADD | DELETE | Map.SET
            switch (type) {
                case "add" /* ADD */:
                    if (!isArray(target)) {
                        add(depsMap.get(ITERATE_KEY));
                        if (isMap(target)) {
                            add(depsMap.get(MAP_KEY_ITERATE_KEY));
                        }
                    }
                    else if (isIntegerKey(key)) {
                        // new index added to array -> length changes
                        add(depsMap.get('length'));
                    }
                    break;
                case "delete" /* DELETE */:
                    if (!isArray(target)) {
                        add(depsMap.get(ITERATE_KEY));
                        if (isMap(target)) {
                            add(depsMap.get(MAP_KEY_ITERATE_KEY));
                        }
                    }
                    break;
                case "set" /* SET */:
                    if (isMap(target)) {
                        add(depsMap.get(ITERATE_KEY));
                    }
                    break;
            }
        }
        const run = (effect) => {
            if (effect.options.onTrigger) {
                effect.options.onTrigger({
                    effect,
                    target,
                    key,
                    type,
                    newValue,
                    oldValue,
                    oldTarget
                });
            }
            if (effect.options.scheduler) {
                effect.options.scheduler(effect);
            }
            else {
                effect();
            }
        };
        effects.forEach(run);
    }

    const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`);
    const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
        .map(key => Symbol[key])
        .filter(isSymbol));
    const get = /*#__PURE__*/ createGetter();
    const shallowGet = /*#__PURE__*/ createGetter(false, true);
    const readonlyGet = /*#__PURE__*/ createGetter(true);
    const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);
    const arrayInstrumentations = {};
    ['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
        const method = Array.prototype[key];
        arrayInstrumentations[key] = function (...args) {
            const arr = toRaw(this);
            for (let i = 0, l = this.length; i < l; i++) {
                track(arr, "get" /* GET */, i + '');
            }
            // we run the method using the original args first (which may be reactive)
            const res = method.apply(arr, args);
            if (res === -1 || res === false) {
                // if that didn't work, run it again using raw values.
                return method.apply(arr, args.map(toRaw));
            }
            else {
                return res;
            }
        };
    });
    ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
        const method = Array.prototype[key];
        arrayInstrumentations[key] = function (...args) {
            pauseTracking();
            const res = method.apply(this, args);
            resetTracking();
            return res;
        };
    });
    function createGetter(isReadonly = false, shallow = false) {
        return function get(target, key, receiver) {
            if (key === "__v_isReactive" /* IS_REACTIVE */) {
                return !isReadonly;
            }
            else if (key === "__v_isReadonly" /* IS_READONLY */) {
                return isReadonly;
            }
            else if (key === "__v_raw" /* RAW */ &&
                receiver === (isReadonly ? readonlyMap : reactiveMap).get(target)) {
                return target;
            }
            const targetIsArray = isArray(target);
            if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
                return Reflect.get(arrayInstrumentations, key, receiver);
            }
            const res = Reflect.get(target, key, receiver);
            if (isSymbol(key)
                ? builtInSymbols.has(key)
                : isNonTrackableKeys(key)) {
                return res;
            }
            if (!isReadonly) {
                track(target, "get" /* GET */, key);
            }
            if (shallow) {
                return res;
            }
            if (isRef(res)) {
                // ref unwrapping - does not apply for Array + integer key.
                const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
                return shouldUnwrap ? res.value : res;
            }
            if (isObject(res)) {
                // Convert returned value into a proxy as well. we do the isObject check
                // here to avoid invalid value warning. Also need to lazy access readonly
                // and reactive here to avoid circular dependency.
                return isReadonly ? readonly(res) : reactive(res);
            }
            return res;
        };
    }
    const set = /*#__PURE__*/ createSetter();
    const shallowSet = /*#__PURE__*/ createSetter(true);
    function createSetter(shallow = false) {
        return function set(target, key, value, receiver) {
            const oldValue = target[key];
            if (!shallow) {
                value = toRaw(value);
                if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                    oldValue.value = value;
                    return true;
                }
            }
            const hadKey = isArray(target) && isIntegerKey(key)
                ? Number(key) < target.length
                : hasOwn(target, key);
            const result = Reflect.set(target, key, value, receiver);
            // don't trigger if target is something up in the prototype chain of original
            if (target === toRaw(receiver)) {
                if (!hadKey) {
                    trigger(target, "add" /* ADD */, key, value);
                }
                else if (hasChanged(value, oldValue)) {
                    trigger(target, "set" /* SET */, key, value, oldValue);
                }
            }
            return result;
        };
    }
    function deleteProperty(target, key) {
        const hadKey = hasOwn(target, key);
        const oldValue = target[key];
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
            trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
        }
        return result;
    }
    function has(target, key) {
        const result = Reflect.has(target, key);
        if (!isSymbol(key) || !builtInSymbols.has(key)) {
            track(target, "has" /* HAS */, key);
        }
        return result;
    }
    function ownKeys(target) {
        track(target, "iterate" /* ITERATE */, isArray(target) ? 'length' : ITERATE_KEY);
        return Reflect.ownKeys(target);
    }
    const mutableHandlers = {
        get,
        set,
        deleteProperty,
        has,
        ownKeys
    };
    const readonlyHandlers = {
        get: readonlyGet,
        set(target, key) {
            {
                console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
            }
            return true;
        },
        deleteProperty(target, key) {
            {
                console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
            }
            return true;
        }
    };
    const shallowReactiveHandlers = extend({}, mutableHandlers, {
        get: shallowGet,
        set: shallowSet
    });
    // Props handlers are special in the sense that it should not unwrap top-level
    // refs (in order to allow refs to be explicitly passed down), but should
    // retain the reactivity of the normal readonly object.
    const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
        get: shallowReadonlyGet
    });

    const toReactive = (value) => isObject(value) ? reactive(value) : value;
    const toReadonly = (value) => isObject(value) ? readonly(value) : value;
    const toShallow = (value) => value;
    const getProto = (v) => Reflect.getPrototypeOf(v);
    function get$1(target, key, isReadonly = false, isShallow = false) {
        // #1772: readonly(reactive(Map)) should return readonly + reactive version
        // of the value
        target = target["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const rawKey = toRaw(key);
        if (key !== rawKey) {
            !isReadonly && track(rawTarget, "get" /* GET */, key);
        }
        !isReadonly && track(rawTarget, "get" /* GET */, rawKey);
        const { has } = getProto(rawTarget);
        const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
        if (has.call(rawTarget, key)) {
            return wrap(target.get(key));
        }
        else if (has.call(rawTarget, rawKey)) {
            return wrap(target.get(rawKey));
        }
    }
    function has$1(key, isReadonly = false) {
        const target = this["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const rawKey = toRaw(key);
        if (key !== rawKey) {
            !isReadonly && track(rawTarget, "has" /* HAS */, key);
        }
        !isReadonly && track(rawTarget, "has" /* HAS */, rawKey);
        return key === rawKey
            ? target.has(key)
            : target.has(key) || target.has(rawKey);
    }
    function size(target, isReadonly = false) {
        target = target["__v_raw" /* RAW */];
        !isReadonly && track(toRaw(target), "iterate" /* ITERATE */, ITERATE_KEY);
        return Reflect.get(target, 'size', target);
    }
    function add(value) {
        value = toRaw(value);
        const target = toRaw(this);
        const proto = getProto(target);
        const hadKey = proto.has.call(target, value);
        if (!hadKey) {
            target.add(value);
            trigger(target, "add" /* ADD */, value, value);
        }
        return this;
    }
    function set$1(key, value) {
        value = toRaw(value);
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
        }
        else {
            checkIdentityKeys(target, has, key);
        }
        const oldValue = get.call(target, key);
        target.set(key, value);
        if (!hadKey) {
            trigger(target, "add" /* ADD */, key, value);
        }
        else if (hasChanged(value, oldValue)) {
            trigger(target, "set" /* SET */, key, value, oldValue);
        }
        return this;
    }
    function deleteEntry(key) {
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
        }
        else {
            checkIdentityKeys(target, has, key);
        }
        const oldValue = get ? get.call(target, key) : undefined;
        // forward the operation before queueing reactions
        const result = target.delete(key);
        if (hadKey) {
            trigger(target, "delete" /* DELETE */, key, undefined, oldValue);
        }
        return result;
    }
    function clear() {
        const target = toRaw(this);
        const hadItems = target.size !== 0;
        const oldTarget = isMap(target)
            ? new Map(target)
            : new Set(target)
            ;
        // forward the operation before queueing reactions
        const result = target.clear();
        if (hadItems) {
            trigger(target, "clear" /* CLEAR */, undefined, undefined, oldTarget);
        }
        return result;
    }
    function createForEach(isReadonly, isShallow) {
        return function forEach(callback, thisArg) {
            const observed = this;
            const target = observed["__v_raw" /* RAW */];
            const rawTarget = toRaw(target);
            const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
            !isReadonly && track(rawTarget, "iterate" /* ITERATE */, ITERATE_KEY);
            return target.forEach((value, key) => {
                // important: make sure the callback is
                // 1. invoked with the reactive map as `this` and 3rd arg
                // 2. the value received should be a corresponding reactive/readonly.
                return callback.call(thisArg, wrap(value), wrap(key), observed);
            });
        };
    }
    function createIterableMethod(method, isReadonly, isShallow) {
        return function (...args) {
            const target = this["__v_raw" /* RAW */];
            const rawTarget = toRaw(target);
            const targetIsMap = isMap(rawTarget);
            const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap);
            const isKeyOnly = method === 'keys' && targetIsMap;
            const innerIterator = target[method](...args);
            const wrap = isReadonly ? toReadonly : isShallow ? toShallow : toReactive;
            !isReadonly &&
                track(rawTarget, "iterate" /* ITERATE */, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
            // return a wrapped iterator which returns observed versions of the
            // values emitted from the real iterator
            return {
                // iterator protocol
                next() {
                    const { value, done } = innerIterator.next();
                    return done
                        ? { value, done }
                        : {
                            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                            done
                        };
                },
                // iterable protocol
                [Symbol.iterator]() {
                    return this;
                }
            };
        };
    }
    function createReadonlyMethod(type) {
        return function (...args) {
            {
                const key = args[0] ? `on key "${args[0]}" ` : ``;
                console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
            }
            return type === "delete" /* DELETE */ ? false : this;
        };
    }
    const mutableInstrumentations = {
        get(key) {
            return get$1(this, key);
        },
        get size() {
            return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, false)
    };
    const shallowInstrumentations = {
        get(key) {
            return get$1(this, key, false, true);
        },
        get size() {
            return size(this);
        },
        has: has$1,
        add,
        set: set$1,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, true)
    };
    const readonlyInstrumentations = {
        get(key) {
            return get$1(this, key, true);
        },
        get size() {
            return size(this, true);
        },
        has(key) {
            return has$1.call(this, key, true);
        },
        add: createReadonlyMethod("add" /* ADD */),
        set: createReadonlyMethod("set" /* SET */),
        delete: createReadonlyMethod("delete" /* DELETE */),
        clear: createReadonlyMethod("clear" /* CLEAR */),
        forEach: createForEach(true, false)
    };
    const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
    iteratorMethods.forEach(method => {
        mutableInstrumentations[method] = createIterableMethod(method, false, false);
        readonlyInstrumentations[method] = createIterableMethod(method, true, false);
        shallowInstrumentations[method] = createIterableMethod(method, false, true);
    });
    function createInstrumentationGetter(isReadonly, shallow) {
        const instrumentations = shallow
            ? shallowInstrumentations
            : isReadonly
                ? readonlyInstrumentations
                : mutableInstrumentations;
        return (target, key, receiver) => {
            if (key === "__v_isReactive" /* IS_REACTIVE */) {
                return !isReadonly;
            }
            else if (key === "__v_isReadonly" /* IS_READONLY */) {
                return isReadonly;
            }
            else if (key === "__v_raw" /* RAW */) {
                return target;
            }
            return Reflect.get(hasOwn(instrumentations, key) && key in target
                ? instrumentations
                : target, key, receiver);
        };
    }
    const mutableCollectionHandlers = {
        get: createInstrumentationGetter(false, false)
    };
    const shallowCollectionHandlers = {
        get: createInstrumentationGetter(false, true)
    };
    const readonlyCollectionHandlers = {
        get: createInstrumentationGetter(true, false)
    };
    function checkIdentityKeys(target, has, key) {
        const rawKey = toRaw(key);
        if (rawKey !== key && has.call(target, rawKey)) {
            const type = toRawType(target);
            console.warn(`Reactive ${type} contains both the raw and reactive ` +
                `versions of the same object${type === `Map` ? ` as keys` : ``}, ` +
                `which can lead to inconsistencies. ` +
                `Avoid differentiating between the raw and reactive versions ` +
                `of an object and only use the reactive version if possible.`);
        }
    }

    const reactiveMap = new WeakMap();
    const readonlyMap = new WeakMap();
    function targetTypeMap(rawType) {
        switch (rawType) {
            case 'Object':
            case 'Array':
                return 1 /* COMMON */;
            case 'Map':
            case 'Set':
            case 'WeakMap':
            case 'WeakSet':
                return 2 /* COLLECTION */;
            default:
                return 0 /* INVALID */;
        }
    }
    function getTargetType(value) {
        return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
            ? 0 /* INVALID */
            : targetTypeMap(toRawType(value));
    }
    function reactive(target) {
        // if trying to observe a readonly proxy, return the readonly version.
        if (target && target["__v_isReadonly" /* IS_READONLY */]) {
            return target;
        }
        return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers);
    }
    /**
     * Return a shallowly-reactive copy of the original object, where only the root
     * level properties are reactive. It also does not auto-unwrap refs (even at the
     * root level).
     */
    function shallowReactive(target) {
        return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers);
    }
    /**
     * Creates a readonly copy of the original object. Note the returned copy is not
     * made reactive, but `readonly` can be called on an already reactive object.
     */
    function readonly(target) {
        return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers);
    }
    /**
     * Returns a reactive-copy of the original object, where only the root level
     * properties are readonly, and does NOT unwrap refs nor recursively convert
     * returned properties.
     * This is used for creating the props proxy object for stateful components.
     */
    function shallowReadonly(target) {
        return createReactiveObject(target, true, shallowReadonlyHandlers, readonlyCollectionHandlers);
    }
    function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers) {
        if (!isObject(target)) {
            {
                console.warn(`value cannot be made reactive: ${String(target)}`);
            }
            return target;
        }
        // target is already a Proxy, return it.
        // exception: calling readonly() on a reactive object
        if (target["__v_raw" /* RAW */] &&
            !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
            return target;
        }
        // target already has corresponding Proxy
        const proxyMap = isReadonly ? readonlyMap : reactiveMap;
        const existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        // only a whitelist of value types can be observed.
        const targetType = getTargetType(target);
        if (targetType === 0 /* INVALID */) {
            return target;
        }
        const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
        proxyMap.set(target, proxy);
        return proxy;
    }
    function isReactive(value) {
        if (isReadonly(value)) {
            return isReactive(value["__v_raw" /* RAW */]);
        }
        return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
    }
    function isReadonly(value) {
        return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
    }
    function isProxy(value) {
        return isReactive(value) || isReadonly(value);
    }
    function toRaw(observed) {
        return ((observed && toRaw(observed["__v_raw" /* RAW */])) || observed);
    }
    function markRaw(value) {
        def(value, "__v_skip" /* SKIP */, true);
        return value;
    }

    const convert = (val) => isObject(val) ? reactive(val) : val;
    function isRef(r) {
        return Boolean(r && r.__v_isRef === true);
    }
    function ref(value) {
        return createRef(value);
    }
    function shallowRef(value) {
        return createRef(value, true);
    }
    class RefImpl {
        constructor(_rawValue, _shallow = false) {
            this._rawValue = _rawValue;
            this._shallow = _shallow;
            this.__v_isRef = true;
            this._value = _shallow ? _rawValue : convert(_rawValue);
        }
        get value() {
            track(toRaw(this), "get" /* GET */, 'value');
            return this._value;
        }
        set value(newVal) {
            if (hasChanged(toRaw(newVal), this._rawValue)) {
                this._rawValue = newVal;
                this._value = this._shallow ? newVal : convert(newVal);
                trigger(toRaw(this), "set" /* SET */, 'value', newVal);
            }
        }
    }
    function createRef(rawValue, shallow = false) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    }
    function triggerRef(ref) {
        trigger(toRaw(ref), "set" /* SET */, 'value', ref.value);
    }
    function unref(ref) {
        return isRef(ref) ? ref.value : ref;
    }
    const shallowUnwrapHandlers = {
        get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
        set: (target, key, value, receiver) => {
            const oldValue = target[key];
            if (isRef(oldValue) && !isRef(value)) {
                oldValue.value = value;
                return true;
            }
            else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    };
    function proxyRefs(objectWithRefs) {
        return isReactive(objectWithRefs)
            ? objectWithRefs
            : new Proxy(objectWithRefs, shallowUnwrapHandlers);
    }
    class CustomRefImpl {
        constructor(factory) {
            this.__v_isRef = true;
            const { get, set } = factory(() => track(this, "get" /* GET */, 'value'), () => trigger(this, "set" /* SET */, 'value'));
            this._get = get;
            this._set = set;
        }
        get value() {
            return this._get();
        }
        set value(newVal) {
            this._set(newVal);
        }
    }
    function customRef(factory) {
        return new CustomRefImpl(factory);
    }
    function toRefs(object) {
        if (!isProxy(object)) {
            console.warn(`toRefs() expects a reactive object but received a plain one.`);
        }
        const ret = isArray(object) ? new Array(object.length) : {};
        for (const key in object) {
            ret[key] = toRef(object, key);
        }
        return ret;
    }
    class ObjectRefImpl {
        constructor(_object, _key) {
            this._object = _object;
            this._key = _key;
            this.__v_isRef = true;
        }
        get value() {
            return this._object[this._key];
        }
        set value(newVal) {
            this._object[this._key] = newVal;
        }
    }
    function toRef(object, key) {
        return isRef(object[key])
            ? object[key]
            : new ObjectRefImpl(object, key);
    }

    class ComputedRefImpl {
        constructor(getter, _setter, isReadonly) {
            this._setter = _setter;
            this._dirty = true;
            this.__v_isRef = true;
            this.effect = effect(getter, {
                lazy: true,
                scheduler: () => {
                    if (!this._dirty) {
                        this._dirty = true;
                        trigger(toRaw(this), "set" /* SET */, 'value');
                    }
                }
            });
            this["__v_isReadonly" /* IS_READONLY */] = isReadonly;
        }
        get value() {
            if (this._dirty) {
                this._value = this.effect();
                this._dirty = false;
            }
            track(toRaw(this), "get" /* GET */, 'value');
            return this._value;
        }
        set value(newValue) {
            this._setter(newValue);
        }
    }
    function computed(getterOrOptions) {
        let getter;
        let setter;
        if (isFunction(getterOrOptions)) {
            getter = getterOrOptions;
            setter = () => {
                console.warn('Write operation failed: computed value is readonly');
            }
                ;
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        return new ComputedRefImpl(getter, setter, isFunction(getterOrOptions) || !getterOrOptions.set);
    }

    const stack = [];
    function pushWarningContext(vnode) {
        stack.push(vnode);
    }
    function popWarningContext() {
        stack.pop();
    }
    function warn(msg, ...args) {
        // avoid props formatting or warn handler tracking deps that might be mutated
        // during patch, leading to infinite recursion.
        pauseTracking();
        const instance = stack.length ? stack[stack.length - 1].component : null;
        const appWarnHandler = instance && instance.appContext.config.warnHandler;
        const trace = getComponentTrace();
        if (appWarnHandler) {
            callWithErrorHandling(appWarnHandler, instance, 11 /* APP_WARN_HANDLER */, [
                msg + args.join(''),
                instance && instance.proxy,
                trace
                    .map(({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`)
                    .join('\n'),
                trace
            ]);
        }
        else {
            const warnArgs = [`[Vue warn]: ${msg}`, ...args];
            /* istanbul ignore if */
            if (trace.length &&
                // avoid spamming console during tests
                !false) {
                warnArgs.push(`\n`, ...formatTrace(trace));
            }
            console.warn(...warnArgs);
        }
        resetTracking();
    }
    function getComponentTrace() {
        let currentVNode = stack[stack.length - 1];
        if (!currentVNode) {
            return [];
        }
        // we can't just use the stack because it will be incomplete during updates
        // that did not start from the root. Re-construct the parent chain using
        // instance parent pointers.
        const normalizedStack = [];
        while (currentVNode) {
            const last = normalizedStack[0];
            if (last && last.vnode === currentVNode) {
                last.recurseCount++;
            }
            else {
                normalizedStack.push({
                    vnode: currentVNode,
                    recurseCount: 0
                });
            }
            const parentInstance = currentVNode.component && currentVNode.component.parent;
            currentVNode = parentInstance && parentInstance.vnode;
        }
        return normalizedStack;
    }
    /* istanbul ignore next */
    function formatTrace(trace) {
        const logs = [];
        trace.forEach((entry, i) => {
            logs.push(...(i === 0 ? [] : [`\n`]), ...formatTraceEntry(entry));
        });
        return logs;
    }
    function formatTraceEntry({ vnode, recurseCount }) {
        const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
        const isRoot = vnode.component ? vnode.component.parent == null : false;
        const open = ` at <${formatComponentName(vnode.component, vnode.type, isRoot)}`;
        const close = `>` + postfix;
        return vnode.props
            ? [open, ...formatProps(vnode.props), close]
            : [open + close];
    }
    /* istanbul ignore next */
    function formatProps(props) {
        const res = [];
        const keys = Object.keys(props);
        keys.slice(0, 3).forEach(key => {
            res.push(...formatProp(key, props[key]));
        });
        if (keys.length > 3) {
            res.push(` ...`);
        }
        return res;
    }
    /* istanbul ignore next */
    function formatProp(key, value, raw) {
        if (isString(value)) {
            value = JSON.stringify(value);
            return raw ? value : [`${key}=${value}`];
        }
        else if (typeof value === 'number' ||
            typeof value === 'boolean' ||
            value == null) {
            return raw ? value : [`${key}=${value}`];
        }
        else if (isRef(value)) {
            value = formatProp(key, toRaw(value.value), true);
            return raw ? value : [`${key}=Ref<`, value, `>`];
        }
        else if (isFunction(value)) {
            return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
        }
        else {
            value = toRaw(value);
            return raw ? value : [`${key}=`, value];
        }
    }

    const ErrorTypeStrings = {
        ["bc" /* BEFORE_CREATE */]: 'beforeCreate hook',
        ["c" /* CREATED */]: 'created hook',
        ["bm" /* BEFORE_MOUNT */]: 'beforeMount hook',
        ["m" /* MOUNTED */]: 'mounted hook',
        ["bu" /* BEFORE_UPDATE */]: 'beforeUpdate hook',
        ["u" /* UPDATED */]: 'updated',
        ["bum" /* BEFORE_UNMOUNT */]: 'beforeUnmount hook',
        ["um" /* UNMOUNTED */]: 'unmounted hook',
        ["a" /* ACTIVATED */]: 'activated hook',
        ["da" /* DEACTIVATED */]: 'deactivated hook',
        ["ec" /* ERROR_CAPTURED */]: 'errorCaptured hook',
        ["rtc" /* RENDER_TRACKED */]: 'renderTracked hook',
        ["rtg" /* RENDER_TRIGGERED */]: 'renderTriggered hook',
        [0 /* SETUP_FUNCTION */]: 'setup function',
        [1 /* RENDER_FUNCTION */]: 'render function',
        [2 /* WATCH_GETTER */]: 'watcher getter',
        [3 /* WATCH_CALLBACK */]: 'watcher callback',
        [4 /* WATCH_CLEANUP */]: 'watcher cleanup function',
        [5 /* NATIVE_EVENT_HANDLER */]: 'native event handler',
        [6 /* COMPONENT_EVENT_HANDLER */]: 'component event handler',
        [7 /* VNODE_HOOK */]: 'vnode hook',
        [8 /* DIRECTIVE_HOOK */]: 'directive hook',
        [9 /* TRANSITION_HOOK */]: 'transition hook',
        [10 /* APP_ERROR_HANDLER */]: 'app errorHandler',
        [11 /* APP_WARN_HANDLER */]: 'app warnHandler',
        [12 /* FUNCTION_REF */]: 'ref function',
        [13 /* ASYNC_COMPONENT_LOADER */]: 'async component loader',
        [14 /* SCHEDULER */]: 'scheduler flush. This is likely a Vue internals bug. ' +
            'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/vue-next'
    };
    function callWithErrorHandling(fn, instance, type, args) {
        let res;
        try {
            res = args ? fn(...args) : fn();
        }
        catch (err) {
            handleError(err, instance, type);
        }
        return res;
    }
    function callWithAsyncErrorHandling(fn, instance, type, args) {
        if (isFunction(fn)) {
            const res = callWithErrorHandling(fn, instance, type, args);
            if (res && isPromise(res)) {
                res.catch(err => {
                    handleError(err, instance, type);
                });
            }
            return res;
        }
        const values = [];
        for (let i = 0; i < fn.length; i++) {
            values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
        }
        return values;
    }
    function handleError(err, instance, type, throwInDev = true) {
        const contextVNode = instance ? instance.vnode : null;
        if (instance) {
            let cur = instance.parent;
            // the exposed instance is the render proxy to keep it consistent with 2.x
            const exposedInstance = instance.proxy;
            // in production the hook receives only the error code
            const errorInfo = ErrorTypeStrings[type];
            while (cur) {
                const errorCapturedHooks = cur.ec;
                if (errorCapturedHooks) {
                    for (let i = 0; i < errorCapturedHooks.length; i++) {
                        if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
                            return;
                        }
                    }
                }
                cur = cur.parent;
            }
            // app-level handling
            const appErrorHandler = instance.appContext.config.errorHandler;
            if (appErrorHandler) {
                callWithErrorHandling(appErrorHandler, null, 10 /* APP_ERROR_HANDLER */, [err, exposedInstance, errorInfo]);
                return;
            }
        }
        logError(err, type, contextVNode, throwInDev);
    }
    function logError(err, type, contextVNode, throwInDev = true) {
        {
            const info = ErrorTypeStrings[type];
            if (contextVNode) {
                pushWarningContext(contextVNode);
            }
            warn(`Unhandled error${info ? ` during execution of ${info}` : ``}`);
            if (contextVNode) {
                popWarningContext();
            }
            // crash in dev by default so it's more noticeable
            if (throwInDev) {
                throw err;
            }
            else {
                console.error(err);
            }
        }
    }

    let isFlushing = false;
    let isFlushPending = false;
    const queue = [];
    let flushIndex = 0;
    const pendingPreFlushCbs = [];
    let activePreFlushCbs = null;
    let preFlushIndex = 0;
    const pendingPostFlushCbs = [];
    let activePostFlushCbs = null;
    let postFlushIndex = 0;
    const resolvedPromise = Promise.resolve();
    let currentFlushPromise = null;
    let currentPreFlushParentJob = null;
    const RECURSION_LIMIT = 100;
    function nextTick(fn) {
        const p = currentFlushPromise || resolvedPromise;
        return fn ? p.then(this ? fn.bind(this) : fn) : p;
    }
    // #2768
    // Use binary-search to find a suitable position in the queue,
    // so that the queue maintains the increasing order of job's id,
    // which can prevent the job from being skipped and also can avoid repeated patching.
    function findInsertionIndex(job) {
        // the start index should be `flushIndex + 1`
        let start = flushIndex + 1;
        let end = queue.length;
        const jobId = getId(job);
        while (start < end) {
            const middle = (start + end) >>> 1;
            const middleJobId = getId(queue[middle]);
            middleJobId < jobId ? (start = middle + 1) : (end = middle);
        }
        return start;
    }
    function queueJob(job) {
        // the dedupe search uses the startIndex argument of Array.includes()
        // by default the search index includes the current job that is being run
        // so it cannot recursively trigger itself again.
        // if the job is a watch() callback, the search will start with a +1 index to
        // allow it recursively trigger itself - it is the user's responsibility to
        // ensure it doesn't end up in an infinite loop.
        if ((!queue.length ||
            !queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)) &&
            job !== currentPreFlushParentJob) {
            const pos = findInsertionIndex(job);
            if (pos > -1) {
                queue.splice(pos, 0, job);
            }
            else {
                queue.push(job);
            }
            queueFlush();
        }
    }
    function queueFlush() {
        if (!isFlushing && !isFlushPending) {
            isFlushPending = true;
            currentFlushPromise = resolvedPromise.then(flushJobs);
        }
    }
    function invalidateJob(job) {
        const i = queue.indexOf(job);
        if (i > -1) {
            queue.splice(i, 1);
        }
    }
    function queueCb(cb, activeQueue, pendingQueue, index) {
        if (!isArray(cb)) {
            if (!activeQueue ||
                !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)) {
                pendingQueue.push(cb);
            }
        }
        else {
            // if cb is an array, it is a component lifecycle hook which can only be
            // triggered by a job, which is already deduped in the main queue, so
            // we can skip duplicate check here to improve perf
            pendingQueue.push(...cb);
        }
        queueFlush();
    }
    function queuePreFlushCb(cb) {
        queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
    }
    function queuePostFlushCb(cb) {
        queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
    }
    function flushPreFlushCbs(seen, parentJob = null) {
        if (pendingPreFlushCbs.length) {
            currentPreFlushParentJob = parentJob;
            activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
            pendingPreFlushCbs.length = 0;
            {
                seen = seen || new Map();
            }
            for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
                {
                    checkRecursiveUpdates(seen, activePreFlushCbs[preFlushIndex]);
                }
                activePreFlushCbs[preFlushIndex]();
            }
            activePreFlushCbs = null;
            preFlushIndex = 0;
            currentPreFlushParentJob = null;
            // recursively flush until it drains
            flushPreFlushCbs(seen, parentJob);
        }
    }
    function flushPostFlushCbs(seen) {
        if (pendingPostFlushCbs.length) {
            const deduped = [...new Set(pendingPostFlushCbs)];
            pendingPostFlushCbs.length = 0;
            // #1947 already has active queue, nested flushPostFlushCbs call
            if (activePostFlushCbs) {
                activePostFlushCbs.push(...deduped);
                return;
            }
            activePostFlushCbs = deduped;
            {
                seen = seen || new Map();
            }
            activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
            for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
                {
                    checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex]);
                }
                activePostFlushCbs[postFlushIndex]();
            }
            activePostFlushCbs = null;
            postFlushIndex = 0;
        }
    }
    const getId = (job) => job.id == null ? Infinity : job.id;
    function flushJobs(seen) {
        isFlushPending = false;
        isFlushing = true;
        {
            seen = seen || new Map();
        }
        flushPreFlushCbs(seen);
        // Sort queue before flush.
        // This ensures that:
        // 1. Components are updated from parent to child. (because parent is always
        //    created before the child so its render effect will have smaller
        //    priority number)
        // 2. If a component is unmounted during a parent component's update,
        //    its update can be skipped.
        queue.sort((a, b) => getId(a) - getId(b));
        try {
            for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
                const job = queue[flushIndex];
                if (job) {
                    if (true) {
                        checkRecursiveUpdates(seen, job);
                    }
                    callWithErrorHandling(job, null, 14 /* SCHEDULER */);
                }
            }
        }
        finally {
            flushIndex = 0;
            queue.length = 0;
            flushPostFlushCbs(seen);
            isFlushing = false;
            currentFlushPromise = null;
            // some postFlushCb queued jobs!
            // keep flushing until it drains.
            if (queue.length || pendingPostFlushCbs.length) {
                flushJobs(seen);
            }
        }
    }
    function checkRecursiveUpdates(seen, fn) {
        if (!seen.has(fn)) {
            seen.set(fn, 1);
        }
        else {
            const count = seen.get(fn);
            if (count > RECURSION_LIMIT) {
                throw new Error(`Maximum recursive updates exceeded. ` +
                    `This means you have a reactive effect that is mutating its own ` +
                    `dependencies and thus recursively triggering itself. Possible sources ` +
                    `include component template, render function, updated hook or ` +
                    `watcher source function.`);
            }
            else {
                seen.set(fn, count + 1);
            }
        }
    }

    /* eslint-disable no-restricted-globals */
    let isHmrUpdating = false;
    const hmrDirtyComponents = new Set();
    // Expose the HMR runtime on the global object
    // This makes it entirely tree-shakable without polluting the exports and makes
    // it easier to be used in toolings like vue-loader
    // Note: for a component to be eligible for HMR it also needs the __hmrId option
    // to be set so that its instances can be registered / removed.
    {
        const globalObject = typeof global !== 'undefined'
            ? global
            : typeof self !== 'undefined'
                ? self
                : typeof window !== 'undefined'
                    ? window
                    : {};
        globalObject.__VUE_HMR_RUNTIME__ = {
            createRecord: tryWrap(createRecord),
            rerender: tryWrap(rerender),
            reload: tryWrap(reload)
        };
    }
    const map = new Map();
    function registerHMR(instance) {
        const id = instance.type.__hmrId;
        let record = map.get(id);
        if (!record) {
            createRecord(id, instance.type);
            record = map.get(id);
        }
        record.instances.add(instance);
    }
    function unregisterHMR(instance) {
        map.get(instance.type.__hmrId).instances.delete(instance);
    }
    function createRecord(id, component) {
        if (!component) {
            warn(`HMR API usage is out of date.\n` +
                `Please upgrade vue-loader/vite/rollup-plugin-vue or other relevant ` +
                `dependency that handles Vue SFC compilation.`);
            component = {};
        }
        if (map.has(id)) {
            return false;
        }
        map.set(id, {
            component: isClassComponent(component) ? component.__vccOpts : component,
            instances: new Set()
        });
        return true;
    }
    function rerender(id, newRender) {
        const record = map.get(id);
        if (!record)
            return;
        if (newRender)
            record.component.render = newRender;
        // Array.from creates a snapshot which avoids the set being mutated during
        // updates
        Array.from(record.instances).forEach(instance => {
            if (newRender) {
                instance.render = newRender;
            }
            instance.renderCache = [];
            // this flag forces child components with slot content to update
            isHmrUpdating = true;
            instance.update();
            isHmrUpdating = false;
        });
    }
    function reload(id, newComp) {
        const record = map.get(id);
        if (!record)
            return;
        // Array.from creates a snapshot which avoids the set being mutated during
        // updates
        const { component, instances } = record;
        if (!hmrDirtyComponents.has(component)) {
            // 1. Update existing comp definition to match new one
            newComp = isClassComponent(newComp) ? newComp.__vccOpts : newComp;
            extend(component, newComp);
            for (const key in component) {
                if (!(key in newComp)) {
                    delete component[key];
                }
            }
            // 2. Mark component dirty. This forces the renderer to replace the component
            // on patch.
            hmrDirtyComponents.add(component);
            // 3. Make sure to unmark the component after the reload.
            queuePostFlushCb(() => {
                hmrDirtyComponents.delete(component);
            });
        }
        Array.from(instances).forEach(instance => {
            if (instance.parent) {
                // 4. Force the parent instance to re-render. This will cause all updated
                // components to be unmounted and re-mounted. Queue the update so that we
                // don't end up forcing the same parent to re-render multiple times.
                queueJob(instance.parent.update);
            }
            else if (instance.appContext.reload) {
                // root instance mounted via createApp() has a reload method
                instance.appContext.reload();
            }
            else if (typeof window !== 'undefined') {
                // root instance inside tree created via raw render(). Force reload.
                window.location.reload();
            }
            else {
                console.warn('[HMR] Root or manually mounted instance modified. Full reload required.');
            }
        });
    }
    function tryWrap(fn) {
        return (id, arg) => {
            try {
                return fn(id, arg);
            }
            catch (e) {
                console.error(e);
                console.warn(`[HMR] Something went wrong during Vue component hot-reload. ` +
                    `Full reload required.`);
            }
        };
    }

    function setDevtoolsHook(hook) {
        exports.devtools = hook;
    }
    function devtoolsInitApp(app, version) {
        // TODO queue if devtools is undefined
        if (!exports.devtools)
            return;
        exports.devtools.emit("app:init" /* APP_INIT */, app, version, {
            Fragment,
            Text,
            Comment,
            Static
        });
    }
    function devtoolsUnmountApp(app) {
        if (!exports.devtools)
            return;
        exports.devtools.emit("app:unmount" /* APP_UNMOUNT */, app);
    }
    const devtoolsComponentAdded = /*#__PURE__*/ createDevtoolsComponentHook("component:added" /* COMPONENT_ADDED */);
    const devtoolsComponentUpdated = /*#__PURE__*/ createDevtoolsComponentHook("component:updated" /* COMPONENT_UPDATED */);
    const devtoolsComponentRemoved = /*#__PURE__*/ createDevtoolsComponentHook("component:removed" /* COMPONENT_REMOVED */);
    function createDevtoolsComponentHook(hook) {
        return (component) => {
            if (!exports.devtools)
                return;
            exports.devtools.emit(hook, component.appContext.app, component.uid, component.parent ? component.parent.uid : undefined, component);
        };
    }
    function devtoolsComponentEmit(component, event, params) {
        if (!exports.devtools)
            return;
        exports.devtools.emit("component:emit" /* COMPONENT_EMIT */, component.appContext.app, component, event, params);
    }

    function emit(instance, event, ...rawArgs) {
        const props = instance.vnode.props || EMPTY_OBJ;
        {
            const { emitsOptions, propsOptions: [propsOptions] } = instance;
            if (emitsOptions) {
                if (!(event in emitsOptions)) {
                    if (!propsOptions || !(toHandlerKey(event) in propsOptions)) {
                        warn(`Component emitted event "${event}" but it is neither declared in ` +
                            `the emits option nor as an "${toHandlerKey(event)}" prop.`);
                    }
                }
                else {
                    const validator = emitsOptions[event];
                    if (isFunction(validator)) {
                        const isValid = validator(...rawArgs);
                        if (!isValid) {
                            warn(`Invalid event arguments: event validation failed for event "${event}".`);
                        }
                    }
                }
            }
        }
        let args = rawArgs;
        const isModelListener = event.startsWith('update:');
        // for v-model update:xxx events, apply modifiers on args
        const modelArg = isModelListener && event.slice(7);
        if (modelArg && modelArg in props) {
            const modifiersKey = `${modelArg === 'modelValue' ? 'model' : modelArg}Modifiers`;
            const { number, trim } = props[modifiersKey] || EMPTY_OBJ;
            if (trim) {
                args = rawArgs.map(a => a.trim());
            }
            else if (number) {
                args = rawArgs.map(toNumber);
            }
        }
        {
            devtoolsComponentEmit(instance, event, args);
        }
        {
            const lowerCaseEvent = event.toLowerCase();
            if (lowerCaseEvent !== event && props[toHandlerKey(lowerCaseEvent)]) {
                warn(`Event "${lowerCaseEvent}" is emitted in component ` +
                    `${formatComponentName(instance, instance.type)} but the handler is registered for "${event}". ` +
                    `Note that HTML attributes are case-insensitive and you cannot use ` +
                    `v-on to listen to camelCase events when using in-DOM templates. ` +
                    `You should probably use "${hyphenate(event)}" instead of "${event}".`);
            }
        }
        // convert handler name to camelCase. See issue #2249
        let handlerName = toHandlerKey(camelize(event));
        let handler = props[handlerName];
        // for v-model update:xxx events, also trigger kebab-case equivalent
        // for props passed via kebab-case
        if (!handler && isModelListener) {
            handlerName = toHandlerKey(hyphenate(event));
            handler = props[handlerName];
        }
        if (handler) {
            callWithAsyncErrorHandling(handler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
        }
        const onceHandler = props[handlerName + `Once`];
        if (onceHandler) {
            if (!instance.emitted) {
                (instance.emitted = {})[handlerName] = true;
            }
            else if (instance.emitted[handlerName]) {
                return;
            }
            callWithAsyncErrorHandling(onceHandler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
        }
    }
    function normalizeEmitsOptions(comp, appContext, asMixin = false) {
        if (!appContext.deopt && comp.__emits !== undefined) {
            return comp.__emits;
        }
        const raw = comp.emits;
        let normalized = {};
        // apply mixin/extends props
        let hasExtends = false;
        if (!isFunction(comp)) {
            const extendEmits = (raw) => {
                hasExtends = true;
                extend(normalized, normalizeEmitsOptions(raw, appContext, true));
            };
            if (!asMixin && appContext.mixins.length) {
                appContext.mixins.forEach(extendEmits);
            }
            if (comp.extends) {
                extendEmits(comp.extends);
            }
            if (comp.mixins) {
                comp.mixins.forEach(extendEmits);
            }
        }
        if (!raw && !hasExtends) {
            return (comp.__emits = null);
        }
        if (isArray(raw)) {
            raw.forEach(key => (normalized[key] = null));
        }
        else {
            extend(normalized, raw);
        }
        return (comp.__emits = normalized);
    }
    // Check if an incoming prop key is a declared emit event listener.
    // e.g. With `emits: { click: null }`, props named `onClick` and `onclick` are
    // both considered matched listeners.
    function isEmitListener(options, key) {
        if (!options || !isOn(key)) {
            return false;
        }
        key = key.slice(2).replace(/Once$/, '');
        return (hasOwn(options, key[0].toLowerCase() + key.slice(1)) ||
            hasOwn(options, hyphenate(key)) ||
            hasOwn(options, key));
    }

    /**
     * mark the current rendering instance for asset resolution (e.g.
     * resolveComponent, resolveDirective) during render
     */
    let currentRenderingInstance = null;
    function setCurrentRenderingInstance(instance) {
        currentRenderingInstance = instance;
    }
    /**
     * dev only flag to track whether $attrs was used during render.
     * If $attrs was used during render then the warning for failed attrs
     * fallthrough can be suppressed.
     */
    let accessedAttrs = false;
    function markAttrsAccessed() {
        accessedAttrs = true;
    }
    function renderComponentRoot(instance) {
        const { type: Component, vnode, proxy, withProxy, props, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, data, setupState, ctx } = instance;
        let result;
        currentRenderingInstance = instance;
        {
            accessedAttrs = false;
        }
        try {
            let fallthroughAttrs;
            if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                // withProxy is a proxy with a different `has` trap only for
                // runtime-compiled render functions using `with` block.
                const proxyToUse = withProxy || proxy;
                result = normalizeVNode(render.call(proxyToUse, proxyToUse, renderCache, props, setupState, data, ctx));
                fallthroughAttrs = attrs;
            }
            else {
                // functional
                const render = Component;
                // in dev, mark attrs accessed if optional props (attrs === props)
                if (true && attrs === props) {
                    markAttrsAccessed();
                }
                result = normalizeVNode(render.length > 1
                    ? render(props, true
                        ? {
                            get attrs() {
                                markAttrsAccessed();
                                return attrs;
                            },
                            slots,
                            emit
                        }
                        : { attrs, slots, emit })
                    : render(props, null /* we know it doesn't need it */));
                fallthroughAttrs = Component.props
                    ? attrs
                    : getFunctionalFallthrough(attrs);
            }
            // attr merging
            // in dev mode, comments are preserved, and it's possible for a template
            // to have comments along side the root element which makes it a fragment
            let root = result;
            let setRoot = undefined;
            if (true &&
                result.patchFlag > 0 &&
                result.patchFlag & 2048 /* DEV_ROOT_FRAGMENT */) {
                ;
                [root, setRoot] = getChildRoot(result);
            }
            if (Component.inheritAttrs !== false && fallthroughAttrs) {
                const keys = Object.keys(fallthroughAttrs);
                const { shapeFlag } = root;
                if (keys.length) {
                    if (shapeFlag & 1 /* ELEMENT */ ||
                        shapeFlag & 6 /* COMPONENT */) {
                        if (propsOptions && keys.some(isModelListener)) {
                            // If a v-model listener (onUpdate:xxx) has a corresponding declared
                            // prop, it indicates this component expects to handle v-model and
                            // it should not fallthrough.
                            // related: #1543, #1643, #1989
                            fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
                        }
                        root = cloneVNode(root, fallthroughAttrs);
                    }
                    else if (true && !accessedAttrs && root.type !== Comment) {
                        const allAttrs = Object.keys(attrs);
                        const eventAttrs = [];
                        const extraAttrs = [];
                        for (let i = 0, l = allAttrs.length; i < l; i++) {
                            const key = allAttrs[i];
                            if (isOn(key)) {
                                // ignore v-model handlers when they fail to fallthrough
                                if (!isModelListener(key)) {
                                    // remove `on`, lowercase first letter to reflect event casing
                                    // accurately
                                    eventAttrs.push(key[2].toLowerCase() + key.slice(3));
                                }
                            }
                            else {
                                extraAttrs.push(key);
                            }
                        }
                        if (extraAttrs.length) {
                            warn(`Extraneous non-props attributes (` +
                                `${extraAttrs.join(', ')}) ` +
                                `were passed to component but could not be automatically inherited ` +
                                `because component renders fragment or text root nodes.`);
                        }
                        if (eventAttrs.length) {
                            warn(`Extraneous non-emits event listeners (` +
                                `${eventAttrs.join(', ')}) ` +
                                `were passed to component but could not be automatically inherited ` +
                                `because component renders fragment or text root nodes. ` +
                                `If the listener is intended to be a component custom event listener only, ` +
                                `declare it using the "emits" option.`);
                        }
                    }
                }
            }
            // inherit directives
            if (vnode.dirs) {
                if (true && !isElementRoot(root)) {
                    warn(`Runtime directive used on component with non-element root node. ` +
                        `The directives will not function as intended.`);
                }
                root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
            }
            // inherit transition data
            if (vnode.transition) {
                if (true && !isElementRoot(root)) {
                    warn(`Component inside <Transition> renders non-element root node ` +
                        `that cannot be animated.`);
                }
                root.transition = vnode.transition;
            }
            if (true && setRoot) {
                setRoot(root);
            }
            else {
                result = root;
            }
        }
        catch (err) {
            handleError(err, instance, 1 /* RENDER_FUNCTION */);
            result = createVNode(Comment);
        }
        currentRenderingInstance = null;
        return result;
    }
    /**
     * dev only
     * In dev mode, template root level comments are rendered, which turns the
     * template into a fragment root, but we need to locate the single element
     * root for attrs and scope id processing.
     */
    const getChildRoot = (vnode) => {
        const rawChildren = vnode.children;
        const dynamicChildren = vnode.dynamicChildren;
        const childRoot = filterSingleRoot(rawChildren);
        if (!childRoot) {
            return [vnode, undefined];
        }
        const index = rawChildren.indexOf(childRoot);
        const dynamicIndex = dynamicChildren ? dynamicChildren.indexOf(childRoot) : -1;
        const setRoot = (updatedRoot) => {
            rawChildren[index] = updatedRoot;
            if (dynamicChildren) {
                if (dynamicIndex > -1) {
                    dynamicChildren[dynamicIndex] = updatedRoot;
                }
                else if (updatedRoot.patchFlag > 0) {
                    vnode.dynamicChildren = [...dynamicChildren, updatedRoot];
                }
            }
        };
        return [normalizeVNode(childRoot), setRoot];
    };
    function filterSingleRoot(children) {
        let singleRoot;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (isVNode(child)) {
                // ignore user comment
                if (child.type !== Comment || child.children === 'v-if') {
                    if (singleRoot) {
                        // has more than 1 non-comment child, return now
                        return;
                    }
                    else {
                        singleRoot = child;
                    }
                }
            }
            else {
                return;
            }
        }
        return singleRoot;
    }
    const getFunctionalFallthrough = (attrs) => {
        let res;
        for (const key in attrs) {
            if (key === 'class' || key === 'style' || isOn(key)) {
                (res || (res = {}))[key] = attrs[key];
            }
        }
        return res;
    };
    const filterModelListeners = (attrs, props) => {
        const res = {};
        for (const key in attrs) {
            if (!isModelListener(key) || !(key.slice(9) in props)) {
                res[key] = attrs[key];
            }
        }
        return res;
    };
    const isElementRoot = (vnode) => {
        return (vnode.shapeFlag & 6 /* COMPONENT */ ||
            vnode.shapeFlag & 1 /* ELEMENT */ ||
            vnode.type === Comment // potential v-if branch switch
        );
    };
    function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
        const { props: prevProps, children: prevChildren, component } = prevVNode;
        const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
        const emits = component.emitsOptions;
        // Parent component's render function was hot-updated. Since this may have
        // caused the child component's slots content to have changed, we need to
        // force the child to update as well.
        if ((prevChildren || nextChildren) && isHmrUpdating) {
            return true;
        }
        // force child update for runtime directive or transition on component vnode.
        if (nextVNode.dirs || nextVNode.transition) {
            return true;
        }
        if (optimized && patchFlag >= 0) {
            if (patchFlag & 1024 /* DYNAMIC_SLOTS */) {
                // slot content that references values that might have changed,
                // e.g. in a v-for
                return true;
            }
            if (patchFlag & 16 /* FULL_PROPS */) {
                if (!prevProps) {
                    return !!nextProps;
                }
                // presence of this flag indicates props are always non-null
                return hasPropsChanged(prevProps, nextProps, emits);
            }
            else if (patchFlag & 8 /* PROPS */) {
                const dynamicProps = nextVNode.dynamicProps;
                for (let i = 0; i < dynamicProps.length; i++) {
                    const key = dynamicProps[i];
                    if (nextProps[key] !== prevProps[key] &&
                        !isEmitListener(emits, key)) {
                        return true;
                    }
                }
            }
        }
        else {
            // this path is only taken by manually written render functions
            // so presence of any children leads to a forced update
            if (prevChildren || nextChildren) {
                if (!nextChildren || !nextChildren.$stable) {
                    return true;
                }
            }
            if (prevProps === nextProps) {
                return false;
            }
            if (!prevProps) {
                return !!nextProps;
            }
            if (!nextProps) {
                return true;
            }
            return hasPropsChanged(prevProps, nextProps, emits);
        }
        return false;
    }
    function hasPropsChanged(prevProps, nextProps, emitsOptions) {
        const nextKeys = Object.keys(nextProps);
        if (nextKeys.length !== Object.keys(prevProps).length) {
            return true;
        }
        for (let i = 0; i < nextKeys.length; i++) {
            const key = nextKeys[i];
            if (nextProps[key] !== prevProps[key] &&
                !isEmitListener(emitsOptions, key)) {
                return true;
            }
        }
        return false;
    }
    function updateHOCHostEl({ vnode, parent }, el // HostNode
    ) {
        while (parent && parent.subTree === vnode) {
            (vnode = parent.vnode).el = el;
            parent = parent.parent;
        }
    }

    const isSuspense = (type) => type.__isSuspense;
    // Suspense exposes a component-like API, and is treated like a component
    // in the compiler, but internally it's a special built-in type that hooks
    // directly into the renderer.
    const SuspenseImpl = {
        // In order to make Suspense tree-shakable, we need to avoid importing it
        // directly in the renderer. The renderer checks for the __isSuspense flag
        // on a vnode's type and calls the `process` method, passing in renderer
        // internals.
        __isSuspense: true,
        process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized,
            // platform-specific impl passed from renderer
            rendererInternals) {
            if (n1 == null) {
                mountSuspense(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, rendererInternals);
            }
            else {
                patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, rendererInternals);
            }
        },
        hydrate: hydrateSuspense,
        create: createSuspenseBoundary
    };
    // Force-casted public typing for h and TSX props inference
    const Suspense = (SuspenseImpl
    );
    function mountSuspense(vnode, container, anchor, parentComponent, parentSuspense, isSVG, optimized, rendererInternals) {
        const { p: patch, o: { createElement } } = rendererInternals;
        const hiddenContainer = createElement('div');
        const suspense = (vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, isSVG, optimized, rendererInternals));
        // start mounting the content subtree in an off-dom container
        patch(null, (suspense.pendingBranch = vnode.ssContent), hiddenContainer, null, parentComponent, suspense, isSVG);
        // now check if we have encountered any async deps
        if (suspense.deps > 0) {
            // has async
            // mount the fallback tree
            patch(null, vnode.ssFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                isSVG);
            setActiveBranch(suspense, vnode.ssFallback);
        }
        else {
            // Suspense has no async deps. Just resolve.
            suspense.resolve();
        }
    }
    function patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, { p: patch, um: unmount, o: { createElement } }) {
        const suspense = (n2.suspense = n1.suspense);
        suspense.vnode = n2;
        n2.el = n1.el;
        const newBranch = n2.ssContent;
        const newFallback = n2.ssFallback;
        const { activeBranch, pendingBranch, isInFallback, isHydrating } = suspense;
        if (pendingBranch) {
            suspense.pendingBranch = newBranch;
            if (isSameVNodeType(newBranch, pendingBranch)) {
                // same root type but content may have changed.
                patch(pendingBranch, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG);
                if (suspense.deps <= 0) {
                    suspense.resolve();
                }
                else if (isInFallback) {
                    patch(activeBranch, newFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                        isSVG);
                    setActiveBranch(suspense, newFallback);
                }
            }
            else {
                // toggled before pending tree is resolved
                suspense.pendingId++;
                if (isHydrating) {
                    // if toggled before hydration is finished, the current DOM tree is
                    // no longer valid. set it as the active branch so it will be unmounted
                    // when resolved
                    suspense.isHydrating = false;
                    suspense.activeBranch = pendingBranch;
                }
                else {
                    unmount(pendingBranch, parentComponent, suspense);
                }
                // increment pending ID. this is used to invalidate async callbacks
                // reset suspense state
                suspense.deps = 0;
                // discard effects from pending branch
                suspense.effects.length = 0;
                // discard previous container
                suspense.hiddenContainer = createElement('div');
                if (isInFallback) {
                    // already in fallback state
                    patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG);
                    if (suspense.deps <= 0) {
                        suspense.resolve();
                    }
                    else {
                        patch(activeBranch, newFallback, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                            isSVG);
                        setActiveBranch(suspense, newFallback);
                    }
                }
                else if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
                    // toggled "back" to current active branch
                    patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG);
                    // force resolve
                    suspense.resolve(true);
                }
                else {
                    // switched to a 3rd branch
                    patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG);
                    if (suspense.deps <= 0) {
                        suspense.resolve();
                    }
                }
            }
        }
        else {
            if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
                // root did not change, just normal patch
                patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG);
                setActiveBranch(suspense, newBranch);
            }
            else {
                // root node toggled
                // invoke @pending event
                const onPending = n2.props && n2.props.onPending;
                if (isFunction(onPending)) {
                    onPending();
                }
                // mount pending branch in off-dom container
                suspense.pendingBranch = newBranch;
                suspense.pendingId++;
                patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG);
                if (suspense.deps <= 0) {
                    // incoming branch has no async deps, resolve now.
                    suspense.resolve();
                }
                else {
                    const { timeout, pendingId } = suspense;
                    if (timeout > 0) {
                        setTimeout(() => {
                            if (suspense.pendingId === pendingId) {
                                suspense.fallback(newFallback);
                            }
                        }, timeout);
                    }
                    else if (timeout === 0) {
                        suspense.fallback(newFallback);
                    }
                }
            }
        }
    }
    let hasWarned = false;
    function createSuspenseBoundary(vnode, parent, parentComponent, container, hiddenContainer, anchor, isSVG, optimized, rendererInternals, isHydrating = false) {
        /* istanbul ignore if */
        if (!hasWarned) {
            hasWarned = true;
            // @ts-ignore `console.info` cannot be null error
            console[console.info ? 'info' : 'log'](`<Suspense> is an experimental feature and its API will likely change.`);
        }
        const { p: patch, m: move, um: unmount, n: next, o: { parentNode, remove } } = rendererInternals;
        const timeout = toNumber(vnode.props && vnode.props.timeout);
        const suspense = {
            vnode,
            parent,
            parentComponent,
            isSVG,
            container,
            hiddenContainer,
            anchor,
            deps: 0,
            pendingId: 0,
            timeout: typeof timeout === 'number' ? timeout : -1,
            activeBranch: null,
            pendingBranch: null,
            isInFallback: true,
            isHydrating,
            isUnmounted: false,
            effects: [],
            resolve(resume = false) {
                {
                    if (!resume && !suspense.pendingBranch) {
                        throw new Error(`suspense.resolve() is called without a pending branch.`);
                    }
                    if (suspense.isUnmounted) {
                        throw new Error(`suspense.resolve() is called on an already unmounted suspense boundary.`);
                    }
                }
                const { vnode, activeBranch, pendingBranch, pendingId, effects, parentComponent, container } = suspense;
                if (suspense.isHydrating) {
                    suspense.isHydrating = false;
                }
                else if (!resume) {
                    const delayEnter = activeBranch &&
                        pendingBranch.transition &&
                        pendingBranch.transition.mode === 'out-in';
                    if (delayEnter) {
                        activeBranch.transition.afterLeave = () => {
                            if (pendingId === suspense.pendingId) {
                                move(pendingBranch, container, anchor, 0 /* ENTER */);
                            }
                        };
                    }
                    // this is initial anchor on mount
                    let { anchor } = suspense;
                    // unmount current active tree
                    if (activeBranch) {
                        // if the fallback tree was mounted, it may have been moved
                        // as part of a parent suspense. get the latest anchor for insertion
                        anchor = next(activeBranch);
                        unmount(activeBranch, parentComponent, suspense, true);
                    }
                    if (!delayEnter) {
                        // move content from off-dom container to actual container
                        move(pendingBranch, container, anchor, 0 /* ENTER */);
                    }
                }
                setActiveBranch(suspense, pendingBranch);
                suspense.pendingBranch = null;
                suspense.isInFallback = false;
                // flush buffered effects
                // check if there is a pending parent suspense
                let parent = suspense.parent;
                let hasUnresolvedAncestor = false;
                while (parent) {
                    if (parent.pendingBranch) {
                        // found a pending parent suspense, merge buffered post jobs
                        // into that parent
                        parent.effects.push(...effects);
                        hasUnresolvedAncestor = true;
                        break;
                    }
                    parent = parent.parent;
                }
                // no pending parent suspense, flush all jobs
                if (!hasUnresolvedAncestor) {
                    queuePostFlushCb(effects);
                }
                suspense.effects = [];
                // invoke @resolve event
                const onResolve = vnode.props && vnode.props.onResolve;
                if (isFunction(onResolve)) {
                    onResolve();
                }
            },
            fallback(fallbackVNode) {
                if (!suspense.pendingBranch) {
                    return;
                }
                const { vnode, activeBranch, parentComponent, container, isSVG } = suspense;
                // invoke @fallback event
                const onFallback = vnode.props && vnode.props.onFallback;
                if (isFunction(onFallback)) {
                    onFallback();
                }
                const anchor = next(activeBranch);
                const mountFallback = () => {
                    if (!suspense.isInFallback) {
                        return;
                    }
                    // mount the fallback tree
                    patch(null, fallbackVNode, container, anchor, parentComponent, null, // fallback tree will not have suspense context
                        isSVG);
                    setActiveBranch(suspense, fallbackVNode);
                };
                const delayEnter = fallbackVNode.transition && fallbackVNode.transition.mode === 'out-in';
                if (delayEnter) {
                    activeBranch.transition.afterLeave = mountFallback;
                }
                // unmount current active branch
                unmount(activeBranch, parentComponent, null, // no suspense so unmount hooks fire now
                    true // shouldRemove
                );
                suspense.isInFallback = true;
                if (!delayEnter) {
                    mountFallback();
                }
            },
            move(container, anchor, type) {
                suspense.activeBranch &&
                    move(suspense.activeBranch, container, anchor, type);
                suspense.container = container;
            },
            next() {
                return suspense.activeBranch && next(suspense.activeBranch);
            },
            registerDep(instance, setupRenderEffect) {
                const isInPendingSuspense = !!suspense.pendingBranch;
                if (isInPendingSuspense) {
                    suspense.deps++;
                }
                const hydratedEl = instance.vnode.el;
                instance
                    .asyncDep.catch(err => {
                        handleError(err, instance, 0 /* SETUP_FUNCTION */);
                    })
                    .then(asyncSetupResult => {
                        // retry when the setup() promise resolves.
                        // component may have been unmounted before resolve.
                        if (instance.isUnmounted ||
                            suspense.isUnmounted ||
                            suspense.pendingId !== instance.suspenseId) {
                            return;
                        }
                        // retry from this component
                        instance.asyncResolved = true;
                        const { vnode } = instance;
                        {
                            pushWarningContext(vnode);
                        }
                        handleSetupResult(instance, asyncSetupResult);
                        if (hydratedEl) {
                            // vnode may have been replaced if an update happened before the
                            // async dep is resolved.
                            vnode.el = hydratedEl;
                        }
                        const placeholder = !hydratedEl && instance.subTree.el;
                        setupRenderEffect(instance, vnode,
                            // component may have been moved before resolve.
                            // if this is not a hydration, instance.subTree will be the comment
                            // placeholder.
                            parentNode(hydratedEl || instance.subTree.el),
                            // anchor will not be used if this is hydration, so only need to
                            // consider the comment placeholder case.
                            hydratedEl ? null : next(instance.subTree), suspense, isSVG, optimized);
                        if (placeholder) {
                            remove(placeholder);
                        }
                        updateHOCHostEl(instance, vnode.el);
                        {
                            popWarningContext();
                        }
                        // only decrease deps count if suspense is not already resolved
                        if (isInPendingSuspense && --suspense.deps === 0) {
                            suspense.resolve();
                        }
                    });
            },
            unmount(parentSuspense, doRemove) {
                suspense.isUnmounted = true;
                if (suspense.activeBranch) {
                    unmount(suspense.activeBranch, parentComponent, parentSuspense, doRemove);
                }
                if (suspense.pendingBranch) {
                    unmount(suspense.pendingBranch, parentComponent, parentSuspense, doRemove);
                }
            }
        };
        return suspense;
    }
    function hydrateSuspense(node, vnode, parentComponent, parentSuspense, isSVG, optimized, rendererInternals, hydrateNode) {
        /* eslint-disable no-restricted-globals */
        const suspense = (vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, node.parentNode, document.createElement('div'), null, isSVG, optimized, rendererInternals, true /* hydrating */));
        // there are two possible scenarios for server-rendered suspense:
        // - success: ssr content should be fully resolved
        // - failure: ssr content should be the fallback branch.
        // however, on the client we don't really know if it has failed or not
        // attempt to hydrate the DOM assuming it has succeeded, but we still
        // need to construct a suspense boundary first
        const result = hydrateNode(node, (suspense.pendingBranch = vnode.ssContent), parentComponent, suspense, optimized);
        if (suspense.deps === 0) {
            suspense.resolve();
        }
        return result;
        /* eslint-enable no-restricted-globals */
    }
    function normalizeSuspenseChildren(vnode) {
        const { shapeFlag, children } = vnode;
        let content;
        let fallback;
        if (shapeFlag & 32 /* SLOTS_CHILDREN */) {
            content = normalizeSuspenseSlot(children.default);
            fallback = normalizeSuspenseSlot(children.fallback);
        }
        else {
            content = normalizeSuspenseSlot(children);
            fallback = normalizeVNode(null);
        }
        return {
            content,
            fallback
        };
    }
    function normalizeSuspenseSlot(s) {
        if (isFunction(s)) {
            s = s();
        }
        if (isArray(s)) {
            const singleChild = filterSingleRoot(s);
            if (!singleChild) {
                warn(`<Suspense> slots expect a single root node.`);
            }
            s = singleChild;
        }
        return normalizeVNode(s);
    }
    function queueEffectWithSuspense(fn, suspense) {
        if (suspense && suspense.pendingBranch) {
            if (isArray(fn)) {
                suspense.effects.push(...fn);
            }
            else {
                suspense.effects.push(fn);
            }
        }
        else {
            queuePostFlushCb(fn);
        }
    }
    function setActiveBranch(suspense, branch) {
        suspense.activeBranch = branch;
        const { vnode, parentComponent } = suspense;
        const el = (vnode.el = branch.el);
        // in case suspense is the root node of a component,
        // recursively update the HOC el
        if (parentComponent && parentComponent.subTree === vnode) {
            parentComponent.vnode.el = el;
            updateHOCHostEl(parentComponent, el);
        }
    }

    let isRenderingCompiledSlot = 0;
    const setCompiledSlotRendering = (n) => (isRenderingCompiledSlot += n);
    /**
     * Compiler runtime helper for rendering `<slot/>`
     * @private
     */
    function renderSlot(slots, name, props = {},
        // this is not a user-facing function, so the fallback is always generated by
        // the compiler and guaranteed to be a function returning an array
        fallback) {
        let slot = slots[name];
        if (slot && slot.length > 1) {
            warn(`SSR-optimized slot function detected in a non-SSR-optimized render ` +
                `function. You need to mark this component with $dynamic-slots in the ` +
                `parent template.`);
            slot = () => [];
        }
        // a compiled slot disables block tracking by default to avoid manual
        // invocation interfering with template-based block tracking, but in
        // `renderSlot` we can be sure that it's template-based so we can force
        // enable it.
        isRenderingCompiledSlot++;
        openBlock();
        const validSlotContent = slot && ensureValidVNode(slot(props));
        const rendered = createBlock(Fragment, { key: props.key || `_${name}` }, validSlotContent || (fallback ? fallback() : []), validSlotContent && slots._ === 1 /* STABLE */
            ? 64 /* STABLE_FRAGMENT */
            : -2 /* BAIL */);
        isRenderingCompiledSlot--;
        return rendered;
    }
    function ensureValidVNode(vnodes) {
        return vnodes.some(child => {
            if (!isVNode(child))
                return true;
            if (child.type === Comment)
                return false;
            if (child.type === Fragment &&
                !ensureValidVNode(child.children))
                return false;
            return true;
        })
            ? vnodes
            : null;
    }

    /**
     * Wrap a slot function to memoize current rendering instance
     * @private
     */
    function withCtx(fn, ctx = currentRenderingInstance) {
        if (!ctx)
            return fn;
        const renderFnWithContext = (...args) => {
            // If a user calls a compiled slot inside a template expression (#1745), it
            // can mess up block tracking, so by default we need to push a null block to
            // avoid that. This isn't necessary if rendering a compiled `<slot>`.
            if (!isRenderingCompiledSlot) {
                openBlock(true /* null block that disables tracking */);
            }
            const owner = currentRenderingInstance;
            setCurrentRenderingInstance(ctx);
            const res = fn(...args);
            setCurrentRenderingInstance(owner);
            if (!isRenderingCompiledSlot) {
                closeBlock();
            }
            return res;
        };
        renderFnWithContext._c = true;
        return renderFnWithContext;
    }

    // SFC scoped style ID management.
    let currentScopeId = null;
    const scopeIdStack = [];
    /**
     * @private
     */
    function pushScopeId(id) {
        scopeIdStack.push((currentScopeId = id));
    }
    /**
     * @private
     */
    function popScopeId() {
        scopeIdStack.pop();
        currentScopeId = scopeIdStack[scopeIdStack.length - 1] || null;
    }
    /**
     * @private
     */
    function withScopeId(id) {
        return ((fn) => withCtx(function () {
            pushScopeId(id);
            const res = fn.apply(this, arguments);
            popScopeId();
            return res;
        }));
    }

    function initProps(instance, rawProps, isStateful, // result of bitwise flag comparison
        isSSR = false) {
        const props = {};
        const attrs = {};
        def(attrs, InternalObjectKey, 1);
        setFullProps(instance, rawProps, props, attrs);
        // validation
        {
            validateProps(props, instance);
        }
        if (isStateful) {
            // stateful
            instance.props = isSSR ? props : shallowReactive(props);
        }
        else {
            if (!instance.type.props) {
                // functional w/ optional props, props === attrs
                instance.props = attrs;
            }
            else {
                // functional w/ declared props
                instance.props = props;
            }
        }
        instance.attrs = attrs;
    }
    function updateProps(instance, rawProps, rawPrevProps, optimized) {
        const { props, attrs, vnode: { patchFlag } } = instance;
        const rawCurrentProps = toRaw(props);
        const [options] = instance.propsOptions;
        if (
            // always force full diff in dev
            // - #1942 if hmr is enabled with sfc component
            // - vite#872 non-sfc component used by sfc component
            !((instance.type.__hmrId ||
                (instance.parent && instance.parent.type.__hmrId))) &&
            (optimized || patchFlag > 0) &&
            !(patchFlag & 16 /* FULL_PROPS */)) {
            if (patchFlag & 8 /* PROPS */) {
                // Compiler-generated props & no keys change, just set the updated
                // the props.
                const propsToUpdate = instance.vnode.dynamicProps;
                for (let i = 0; i < propsToUpdate.length; i++) {
                    const key = propsToUpdate[i];
                    // PROPS flag guarantees rawProps to be non-null
                    const value = rawProps[key];
                    if (options) {
                        // attr / props separation was done on init and will be consistent
                        // in this code path, so just check if attrs have it.
                        if (hasOwn(attrs, key)) {
                            attrs[key] = value;
                        }
                        else {
                            const camelizedKey = camelize(key);
                            props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance);
                        }
                    }
                    else {
                        attrs[key] = value;
                    }
                }
            }
        }
        else {
            // full props update.
            setFullProps(instance, rawProps, props, attrs);
            // in case of dynamic props, check if we need to delete keys from
            // the props object
            let kebabKey;
            for (const key in rawCurrentProps) {
                if (!rawProps ||
                    // for camelCase
                    (!hasOwn(rawProps, key) &&
                        // it's possible the original props was passed in as kebab-case
                        // and converted to camelCase (#955)
                        ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey)))) {
                    if (options) {
                        if (rawPrevProps &&
                            // for camelCase
                            (rawPrevProps[key] !== undefined ||
                                // for kebab-case
                                rawPrevProps[kebabKey] !== undefined)) {
                            props[key] = resolvePropValue(options, rawProps || EMPTY_OBJ, key, undefined, instance);
                        }
                    }
                    else {
                        delete props[key];
                    }
                }
            }
            // in the case of functional component w/o props declaration, props and
            // attrs point to the same object so it should already have been updated.
            if (attrs !== rawCurrentProps) {
                for (const key in attrs) {
                    if (!rawProps || !hasOwn(rawProps, key)) {
                        delete attrs[key];
                    }
                }
            }
        }
        // trigger updates for $attrs in case it's used in component slots
        trigger(instance, "set" /* SET */, '$attrs');
        if (rawProps) {
            validateProps(props, instance);
        }
    }
    function setFullProps(instance, rawProps, props, attrs) {
        const [options, needCastKeys] = instance.propsOptions;
        if (rawProps) {
            for (const key in rawProps) {
                const value = rawProps[key];
                // key, ref are reserved and never passed down
                if (isReservedProp(key)) {
                    continue;
                }
                // prop option names are camelized during normalization, so to support
                // kebab -> camel conversion here we need to camelize the key.
                let camelKey;
                if (options && hasOwn(options, (camelKey = camelize(key)))) {
                    props[camelKey] = value;
                }
                else if (!isEmitListener(instance.emitsOptions, key)) {
                    // Any non-declared (either as a prop or an emitted event) props are put
                    // into a separate `attrs` object for spreading. Make sure to preserve
                    // original key casing
                    attrs[key] = value;
                }
            }
        }
        if (needCastKeys) {
            const rawCurrentProps = toRaw(props);
            for (let i = 0; i < needCastKeys.length; i++) {
                const key = needCastKeys[i];
                props[key] = resolvePropValue(options, rawCurrentProps, key, rawCurrentProps[key], instance);
            }
        }
    }
    function resolvePropValue(options, props, key, value, instance) {
        const opt = options[key];
        if (opt != null) {
            const hasDefault = hasOwn(opt, 'default');
            // default values
            if (hasDefault && value === undefined) {
                const defaultValue = opt.default;
                if (opt.type !== Function && isFunction(defaultValue)) {
                    setCurrentInstance(instance);
                    value = defaultValue(props);
                    setCurrentInstance(null);
                }
                else {
                    value = defaultValue;
                }
            }
            // boolean casting
            if (opt[0 /* shouldCast */]) {
                if (!hasOwn(props, key) && !hasDefault) {
                    value = false;
                }
                else if (opt[1 /* shouldCastTrue */] &&
                    (value === '' || value === hyphenate(key))) {
                    value = true;
                }
            }
        }
        return value;
    }
    function normalizePropsOptions(comp, appContext, asMixin = false) {
        if (!appContext.deopt && comp.__props) {
            return comp.__props;
        }
        const raw = comp.props;
        const normalized = {};
        const needCastKeys = [];
        // apply mixin/extends props
        let hasExtends = false;
        if (!isFunction(comp)) {
            const extendProps = (raw) => {
                hasExtends = true;
                const [props, keys] = normalizePropsOptions(raw, appContext, true);
                extend(normalized, props);
                if (keys)
                    needCastKeys.push(...keys);
            };
            if (!asMixin && appContext.mixins.length) {
                appContext.mixins.forEach(extendProps);
            }
            if (comp.extends) {
                extendProps(comp.extends);
            }
            if (comp.mixins) {
                comp.mixins.forEach(extendProps);
            }
        }
        if (!raw && !hasExtends) {
            return (comp.__props = EMPTY_ARR);
        }
        if (isArray(raw)) {
            for (let i = 0; i < raw.length; i++) {
                if (!isString(raw[i])) {
                    warn(`props must be strings when using array syntax.`, raw[i]);
                }
                const normalizedKey = camelize(raw[i]);
                if (validatePropName(normalizedKey)) {
                    normalized[normalizedKey] = EMPTY_OBJ;
                }
            }
        }
        else if (raw) {
            if (!isObject(raw)) {
                warn(`invalid props options`, raw);
            }
            for (const key in raw) {
                const normalizedKey = camelize(key);
                if (validatePropName(normalizedKey)) {
                    const opt = raw[key];
                    const prop = (normalized[normalizedKey] =
                        isArray(opt) || isFunction(opt) ? { type: opt } : opt);
                    if (prop) {
                        const booleanIndex = getTypeIndex(Boolean, prop.type);
                        const stringIndex = getTypeIndex(String, prop.type);
                        prop[0 /* shouldCast */] = booleanIndex > -1;
                        prop[1 /* shouldCastTrue */] =
                            stringIndex < 0 || booleanIndex < stringIndex;
                        // if the prop needs boolean casting or default value
                        if (booleanIndex > -1 || hasOwn(prop, 'default')) {
                            needCastKeys.push(normalizedKey);
                        }
                    }
                }
            }
        }
        return (comp.__props = [normalized, needCastKeys]);
    }
    function validatePropName(key) {
        if (key[0] !== '$') {
            return true;
        }
        else {
            warn(`Invalid prop name: "${key}" is a reserved property.`);
        }
        return false;
    }
    // use function string name to check type constructors
    // so that it works across vms / iframes.
    function getType(ctor) {
        const match = ctor && ctor.toString().match(/^\s*function (\w+)/);
        return match ? match[1] : '';
    }
    function isSameType(a, b) {
        return getType(a) === getType(b);
    }
    function getTypeIndex(type, expectedTypes) {
        if (isArray(expectedTypes)) {
            for (let i = 0, len = expectedTypes.length; i < len; i++) {
                if (isSameType(expectedTypes[i], type)) {
                    return i;
                }
            }
        }
        else if (isFunction(expectedTypes)) {
            return isSameType(expectedTypes, type) ? 0 : -1;
        }
        return -1;
    }
    /**
     * dev only
     */
    function validateProps(props, instance) {
        const rawValues = toRaw(props);
        const options = instance.propsOptions[0];
        for (const key in options) {
            let opt = options[key];
            if (opt == null)
                continue;
            validateProp(key, rawValues[key], opt, !hasOwn(rawValues, key));
        }
    }
    /**
     * dev only
     */
    function validateProp(name, value, prop, isAbsent) {
        const { type, required, validator } = prop;
        // required!
        if (required && isAbsent) {
            warn('Missing required prop: "' + name + '"');
            return;
        }
        // missing but optional
        if (value == null && !prop.required) {
            return;
        }
        // type check
        if (type != null && type !== true) {
            let isValid = false;
            const types = isArray(type) ? type : [type];
            const expectedTypes = [];
            // value is valid as long as one of the specified types match
            for (let i = 0; i < types.length && !isValid; i++) {
                const { valid, expectedType } = assertType(value, types[i]);
                expectedTypes.push(expectedType || '');
                isValid = valid;
            }
            if (!isValid) {
                warn(getInvalidTypeMessage(name, value, expectedTypes));
                return;
            }
        }
        // custom validator
        if (validator && !validator(value)) {
            warn('Invalid prop: custom validator check failed for prop "' + name + '".');
        }
    }
    const isSimpleType = /*#__PURE__*/ makeMap('String,Number,Boolean,Function,Symbol,BigInt');
    /**
     * dev only
     */
    function assertType(value, type) {
        let valid;
        const expectedType = getType(type);
        if (isSimpleType(expectedType)) {
            const t = typeof value;
            valid = t === expectedType.toLowerCase();
            // for primitive wrapper objects
            if (!valid && t === 'object') {
                valid = value instanceof type;
            }
        }
        else if (expectedType === 'Object') {
            valid = isObject(value);
        }
        else if (expectedType === 'Array') {
            valid = isArray(value);
        }
        else {
            valid = value instanceof type;
        }
        return {
            valid,
            expectedType
        };
    }
    /**
     * dev only
     */
    function getInvalidTypeMessage(name, value, expectedTypes) {
        let message = `Invalid prop: type check failed for prop "${name}".` +
            ` Expected ${expectedTypes.map(capitalize).join(', ')}`;
        const expectedType = expectedTypes[0];
        const receivedType = toRawType(value);
        const expectedValue = styleValue(value, expectedType);
        const receivedValue = styleValue(value, receivedType);
        // check if we need to specify expected value
        if (expectedTypes.length === 1 &&
            isExplicable(expectedType) &&
            !isBoolean(expectedType, receivedType)) {
            message += ` with value ${expectedValue}`;
        }
        message += `, got ${receivedType} `;
        // check if we need to specify received value
        if (isExplicable(receivedType)) {
            message += `with value ${receivedValue}.`;
        }
        return message;
    }
    /**
     * dev only
     */
    function styleValue(value, type) {
        if (type === 'String') {
            return `"${value}"`;
        }
        else if (type === 'Number') {
            return `${Number(value)}`;
        }
        else {
            return `${value}`;
        }
    }
    /**
     * dev only
     */
    function isExplicable(type) {
        const explicitTypes = ['string', 'number', 'boolean'];
        return explicitTypes.some(elem => type.toLowerCase() === elem);
    }
    /**
     * dev only
     */
    function isBoolean(...args) {
        return args.some(elem => elem.toLowerCase() === 'boolean');
    }

    function injectHook(type, hook, target = currentInstance, prepend = false) {
        if (target) {
            const hooks = target[type] || (target[type] = []);
            // cache the error handling wrapper for injected hooks so the same hook
            // can be properly deduped by the scheduler. "__weh" stands for "with error
            // handling".
            const wrappedHook = hook.__weh ||
                (hook.__weh = (...args) => {
                    if (target.isUnmounted) {
                        return;
                    }
                    // disable tracking inside all lifecycle hooks
                    // since they can potentially be called inside effects.
                    pauseTracking();
                    // Set currentInstance during hook invocation.
                    // This assumes the hook does not synchronously trigger other hooks, which
                    // can only be false when the user does something really funky.
                    setCurrentInstance(target);
                    const res = callWithAsyncErrorHandling(hook, target, type, args);
                    setCurrentInstance(null);
                    resetTracking();
                    return res;
                });
            if (prepend) {
                hooks.unshift(wrappedHook);
            }
            else {
                hooks.push(wrappedHook);
            }
            return wrappedHook;
        }
        else {
            const apiName = toHandlerKey(ErrorTypeStrings[type].replace(/ hook$/, ''));
            warn(`${apiName} is called when there is no active component instance to be ` +
                `associated with. ` +
                `Lifecycle injection APIs can only be used during execution of setup().` +
                (` If you are using async setup(), make sure to register lifecycle ` +
                    `hooks before the first await statement.`
                ));
        }
    }
    const createHook = (lifecycle) => (hook, target = currentInstance) =>
        // post-create lifecycle registrations are noops during SSR
        !isInSSRComponentSetup && injectHook(lifecycle, hook, target);
    const onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
    const onMounted = createHook("m" /* MOUNTED */);
    const onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
    const onUpdated = createHook("u" /* UPDATED */);
    const onBeforeUnmount = createHook("bum" /* BEFORE_UNMOUNT */);
    const onUnmounted = createHook("um" /* UNMOUNTED */);
    const onRenderTriggered = createHook("rtg" /* RENDER_TRIGGERED */);
    const onRenderTracked = createHook("rtc" /* RENDER_TRACKED */);
    const onErrorCaptured = (hook, target = currentInstance) => {
        injectHook("ec" /* ERROR_CAPTURED */, hook, target);
    };

    // Simple effect.
    function watchEffect(effect, options) {
        return doWatch(effect, null, options);
    }
    // initial value for watchers to trigger on undefined initial values
    const INITIAL_WATCHER_VALUE = {};
    // implementation
    function watch(source, cb, options) {
        if (!isFunction(cb)) {
            warn(`\`watch(fn, options?)\` signature has been moved to a separate API. ` +
                `Use \`watchEffect(fn, options?)\` instead. \`watch\` now only ` +
                `supports \`watch(source, cb, options?) signature.`);
        }
        return doWatch(source, cb, options);
    }
    function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ, instance = currentInstance) {
        if (!cb) {
            if (immediate !== undefined) {
                warn(`watch() "immediate" option is only respected when using the ` +
                    `watch(source, callback, options?) signature.`);
            }
            if (deep !== undefined) {
                warn(`watch() "deep" option is only respected when using the ` +
                    `watch(source, callback, options?) signature.`);
            }
        }
        const warnInvalidSource = (s) => {
            warn(`Invalid watch source: `, s, `A watch source can only be a getter/effect function, a ref, ` +
                `a reactive object, or an array of these types.`);
        };
        let getter;
        let forceTrigger = false;
        if (isRef(source)) {
            getter = () => source.value;
            forceTrigger = !!source._shallow;
        }
        else if (isReactive(source)) {
            getter = () => source;
            deep = true;
        }
        else if (isArray(source)) {
            getter = () => source.map(s => {
                if (isRef(s)) {
                    return s.value;
                }
                else if (isReactive(s)) {
                    return traverse(s);
                }
                else if (isFunction(s)) {
                    return callWithErrorHandling(s, instance, 2 /* WATCH_GETTER */, [
                        instance && instance.proxy
                    ]);
                }
                else {
                    warnInvalidSource(s);
                }
            });
        }
        else if (isFunction(source)) {
            if (cb) {
                // getter with cb
                getter = () => callWithErrorHandling(source, instance, 2 /* WATCH_GETTER */, [
                    instance && instance.proxy
                ]);
            }
            else {
                // no cb -> simple effect
                getter = () => {
                    if (instance && instance.isUnmounted) {
                        return;
                    }
                    if (cleanup) {
                        cleanup();
                    }
                    return callWithErrorHandling(source, instance, 3 /* WATCH_CALLBACK */, [onInvalidate]);
                };
            }
        }
        else {
            getter = NOOP;
            warnInvalidSource(source);
        }
        if (cb && deep) {
            const baseGetter = getter;
            getter = () => traverse(baseGetter());
        }
        let cleanup;
        const onInvalidate = (fn) => {
            cleanup = runner.options.onStop = () => {
                callWithErrorHandling(fn, instance, 4 /* WATCH_CLEANUP */);
            };
        };
        let oldValue = isArray(source) ? [] : INITIAL_WATCHER_VALUE;
        const job = () => {
            if (!runner.active) {
                return;
            }
            if (cb) {
                // watch(source, cb)
                const newValue = runner();
                if (deep || forceTrigger || hasChanged(newValue, oldValue)) {
                    // cleanup before running cb again
                    if (cleanup) {
                        cleanup();
                    }
                    callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
                        newValue,
                        // pass undefined as the old value when it's changed for the first time
                        oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                        onInvalidate
                    ]);
                    oldValue = newValue;
                }
            }
            else {
                // watchEffect
                runner();
            }
        };
        // important: mark the job as a watcher callback so that scheduler knows
        // it is allowed to self-trigger (#1727)
        job.allowRecurse = !!cb;
        let scheduler;
        if (flush === 'sync') {
            scheduler = job;
        }
        else if (flush === 'post') {
            scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
        }
        else {
            // default: 'pre'
            scheduler = () => {
                if (!instance || instance.isMounted) {
                    queuePreFlushCb(job);
                }
                else {
                    // with 'pre' option, the first call must happen before
                    // the component is mounted so it is called synchronously.
                    job();
                }
            };
        }
        const runner = effect(getter, {
            lazy: true,
            onTrack,
            onTrigger,
            scheduler
        });
        recordInstanceBoundEffect(runner, instance);
        // initial run
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                oldValue = runner();
            }
        }
        else if (flush === 'post') {
            queuePostRenderEffect(runner, instance && instance.suspense);
        }
        else {
            runner();
        }
        return () => {
            stop(runner);
            if (instance) {
                remove(instance.effects, runner);
            }
        };
    }
    // this.$watch
    function instanceWatch(source, cb, options) {
        const publicThis = this.proxy;
        const getter = isString(source)
            ? () => publicThis[source]
            : source.bind(publicThis);
        return doWatch(getter, cb.bind(publicThis), options, this);
    }
    function traverse(value, seen = new Set()) {
        if (!isObject(value) || seen.has(value)) {
            return value;
        }
        seen.add(value);
        if (isRef(value)) {
            traverse(value.value, seen);
        }
        else if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                traverse(value[i], seen);
            }
        }
        else if (isSet(value) || isMap(value)) {
            value.forEach((v) => {
                traverse(v, seen);
            });
        }
        else {
            for (const key in value) {
                traverse(value[key], seen);
            }
        }
        return value;
    }

    function useTransitionState() {
        const state = {
            isMounted: false,
            isLeaving: false,
            isUnmounting: false,
            leavingVNodes: new Map()
        };
        onMounted(() => {
            state.isMounted = true;
        });
        onBeforeUnmount(() => {
            state.isUnmounting = true;
        });
        return state;
    }
    const TransitionHookValidator = [Function, Array];
    const BaseTransitionImpl = {
        name: `BaseTransition`,
        props: {
            mode: String,
            appear: Boolean,
            persisted: Boolean,
            // enter
            onBeforeEnter: TransitionHookValidator,
            onEnter: TransitionHookValidator,
            onAfterEnter: TransitionHookValidator,
            onEnterCancelled: TransitionHookValidator,
            // leave
            onBeforeLeave: TransitionHookValidator,
            onLeave: TransitionHookValidator,
            onAfterLeave: TransitionHookValidator,
            onLeaveCancelled: TransitionHookValidator,
            // appear
            onBeforeAppear: TransitionHookValidator,
            onAppear: TransitionHookValidator,
            onAfterAppear: TransitionHookValidator,
            onAppearCancelled: TransitionHookValidator
        },
        setup(props, { slots }) {
            const instance = getCurrentInstance();
            const state = useTransitionState();
            let prevTransitionKey;
            return () => {
                const children = slots.default && getTransitionRawChildren(slots.default(), true);
                if (!children || !children.length) {
                    return;
                }
                // warn multiple elements
                if (children.length > 1) {
                    warn('<transition> can only be used on a single element or component. Use ' +
                        '<transition-group> for lists.');
                }
                // there's no need to track reactivity for these props so use the raw
                // props for a bit better perf
                const rawProps = toRaw(props);
                const { mode } = rawProps;
                // check mode
                if (mode && !['in-out', 'out-in', 'default'].includes(mode)) {
                    warn(`invalid <transition> mode: ${mode}`);
                }
                // at this point children has a guaranteed length of 1.
                const child = children[0];
                if (state.isLeaving) {
                    return emptyPlaceholder(child);
                }
                // in the case of <transition><keep-alive/></transition>, we need to
                // compare the type of the kept-alive children.
                const innerChild = getKeepAliveChild(child);
                if (!innerChild) {
                    return emptyPlaceholder(child);
                }
                const enterHooks = resolveTransitionHooks(innerChild, rawProps, state, instance);
                setTransitionHooks(innerChild, enterHooks);
                const oldChild = instance.subTree;
                const oldInnerChild = oldChild && getKeepAliveChild(oldChild);
                let transitionKeyChanged = false;
                const { getTransitionKey } = innerChild.type;
                if (getTransitionKey) {
                    const key = getTransitionKey();
                    if (prevTransitionKey === undefined) {
                        prevTransitionKey = key;
                    }
                    else if (key !== prevTransitionKey) {
                        prevTransitionKey = key;
                        transitionKeyChanged = true;
                    }
                }
                // handle mode
                if (oldInnerChild &&
                    oldInnerChild.type !== Comment &&
                    (!isSameVNodeType(innerChild, oldInnerChild) || transitionKeyChanged)) {
                    const leavingHooks = resolveTransitionHooks(oldInnerChild, rawProps, state, instance);
                    // update old tree's hooks in case of dynamic transition
                    setTransitionHooks(oldInnerChild, leavingHooks);
                    // switching between different views
                    if (mode === 'out-in') {
                        state.isLeaving = true;
                        // return placeholder node and queue update when leave finishes
                        leavingHooks.afterLeave = () => {
                            state.isLeaving = false;
                            instance.update();
                        };
                        return emptyPlaceholder(child);
                    }
                    else if (mode === 'in-out') {
                        leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
                            const leavingVNodesCache = getLeavingNodesForType(state, oldInnerChild);
                            leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
                            // early removal callback
                            el._leaveCb = () => {
                                earlyRemove();
                                el._leaveCb = undefined;
                                delete enterHooks.delayedLeave;
                            };
                            enterHooks.delayedLeave = delayedLeave;
                        };
                    }
                }
                return child;
            };
        }
    };
    // export the public type for h/tsx inference
    // also to avoid inline import() in generated d.ts files
    const BaseTransition = BaseTransitionImpl;
    function getLeavingNodesForType(state, vnode) {
        const { leavingVNodes } = state;
        let leavingVNodesCache = leavingVNodes.get(vnode.type);
        if (!leavingVNodesCache) {
            leavingVNodesCache = Object.create(null);
            leavingVNodes.set(vnode.type, leavingVNodesCache);
        }
        return leavingVNodesCache;
    }
    // The transition hooks are attached to the vnode as vnode.transition
    // and will be called at appropriate timing in the renderer.
    function resolveTransitionHooks(vnode, props, state, instance) {
        const { appear, mode, persisted = false, onBeforeEnter, onEnter, onAfterEnter, onEnterCancelled, onBeforeLeave, onLeave, onAfterLeave, onLeaveCancelled, onBeforeAppear, onAppear, onAfterAppear, onAppearCancelled } = props;
        const key = String(vnode.key);
        const leavingVNodesCache = getLeavingNodesForType(state, vnode);
        const callHook = (hook, args) => {
            hook &&
                callWithAsyncErrorHandling(hook, instance, 9 /* TRANSITION_HOOK */, args);
        };
        const hooks = {
            mode,
            persisted,
            beforeEnter(el) {
                let hook = onBeforeEnter;
                if (!state.isMounted) {
                    if (appear) {
                        hook = onBeforeAppear || onBeforeEnter;
                    }
                    else {
                        return;
                    }
                }
                // for same element (v-show)
                if (el._leaveCb) {
                    el._leaveCb(true /* cancelled */);
                }
                // for toggled element with same key (v-if)
                const leavingVNode = leavingVNodesCache[key];
                if (leavingVNode &&
                    isSameVNodeType(vnode, leavingVNode) &&
                    leavingVNode.el._leaveCb) {
                    // force early removal (not cancelled)
                    leavingVNode.el._leaveCb();
                }
                callHook(hook, [el]);
            },
            enter(el) {
                let hook = onEnter;
                let afterHook = onAfterEnter;
                let cancelHook = onEnterCancelled;
                if (!state.isMounted) {
                    if (appear) {
                        hook = onAppear || onEnter;
                        afterHook = onAfterAppear || onAfterEnter;
                        cancelHook = onAppearCancelled || onEnterCancelled;
                    }
                    else {
                        return;
                    }
                }
                let called = false;
                const done = (el._enterCb = (cancelled) => {
                    if (called)
                        return;
                    called = true;
                    if (cancelled) {
                        callHook(cancelHook, [el]);
                    }
                    else {
                        callHook(afterHook, [el]);
                    }
                    if (hooks.delayedLeave) {
                        hooks.delayedLeave();
                    }
                    el._enterCb = undefined;
                });
                if (hook) {
                    hook(el, done);
                    if (hook.length <= 1) {
                        done();
                    }
                }
                else {
                    done();
                }
            },
            leave(el, remove) {
                const key = String(vnode.key);
                if (el._enterCb) {
                    el._enterCb(true /* cancelled */);
                }
                if (state.isUnmounting) {
                    return remove();
                }
                callHook(onBeforeLeave, [el]);
                let called = false;
                const done = (el._leaveCb = (cancelled) => {
                    if (called)
                        return;
                    called = true;
                    remove();
                    if (cancelled) {
                        callHook(onLeaveCancelled, [el]);
                    }
                    else {
                        callHook(onAfterLeave, [el]);
                    }
                    el._leaveCb = undefined;
                    if (leavingVNodesCache[key] === vnode) {
                        delete leavingVNodesCache[key];
                    }
                });
                leavingVNodesCache[key] = vnode;
                if (onLeave) {
                    onLeave(el, done);
                    if (onLeave.length <= 1) {
                        done();
                    }
                }
                else {
                    done();
                }
            },
            clone(vnode) {
                return resolveTransitionHooks(vnode, props, state, instance);
            }
        };
        return hooks;
    }
    // the placeholder really only handles one special case: KeepAlive
    // in the case of a KeepAlive in a leave phase we need to return a KeepAlive
    // placeholder with empty content to avoid the KeepAlive instance from being
    // unmounted.
    function emptyPlaceholder(vnode) {
        if (isKeepAlive(vnode)) {
            vnode = cloneVNode(vnode);
            vnode.children = null;
            return vnode;
        }
    }
    function getKeepAliveChild(vnode) {
        return isKeepAlive(vnode)
            ? vnode.children
                ? vnode.children[0]
                : undefined
            : vnode;
    }
    function setTransitionHooks(vnode, hooks) {
        if (vnode.shapeFlag & 6 /* COMPONENT */ && vnode.component) {
            setTransitionHooks(vnode.component.subTree, hooks);
        }
        else if (vnode.shapeFlag & 128 /* SUSPENSE */) {
            vnode.ssContent.transition = hooks.clone(vnode.ssContent);
            vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
        }
        else {
            vnode.transition = hooks;
        }
    }
    function getTransitionRawChildren(children, keepComment = false) {
        let ret = [];
        let keyedFragmentCount = 0;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // handle fragment children case, e.g. v-for
            if (child.type === Fragment) {
                if (child.patchFlag & 128 /* KEYED_FRAGMENT */)
                    keyedFragmentCount++;
                ret = ret.concat(getTransitionRawChildren(child.children, keepComment));
            }
            // comment placeholders should be skipped, e.g. v-if
            else if (keepComment || child.type !== Comment) {
                ret.push(child);
            }
        }
        // #1126 if a transition children list contains multiple sub fragments, these
        // fragments will be merged into a flat children array. Since each v-for
        // fragment may contain different static bindings inside, we need to de-op
        // these children to force full diffs to ensure correct behavior.
        if (keyedFragmentCount > 1) {
            for (let i = 0; i < ret.length; i++) {
                ret[i].patchFlag = -2 /* BAIL */;
            }
        }
        return ret;
    }

    const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
    const KeepAliveImpl = {
        name: `KeepAlive`,
        // Marker for special handling inside the renderer. We are not using a ===
        // check directly on KeepAlive in the renderer, because importing it directly
        // would prevent it from being tree-shaken.
        __isKeepAlive: true,
        props: {
            include: [String, RegExp, Array],
            exclude: [String, RegExp, Array],
            max: [String, Number]
        },
        setup(props, { slots }) {
            const cache = new Map();
            const keys = new Set();
            let current = null;
            const instance = getCurrentInstance();
            const parentSuspense = instance.suspense;
            // KeepAlive communicates with the instantiated renderer via the
            // ctx where the renderer passes in its internals,
            // and the KeepAlive instance exposes activate/deactivate implementations.
            // The whole point of this is to avoid importing KeepAlive directly in the
            // renderer to facilitate tree-shaking.
            const sharedContext = instance.ctx;
            const { renderer: { p: patch, m: move, um: _unmount, o: { createElement } } } = sharedContext;
            const storageContainer = createElement('div');
            sharedContext.activate = (vnode, container, anchor, isSVG, optimized) => {
                const instance = vnode.component;
                move(vnode, container, anchor, 0 /* ENTER */, parentSuspense);
                // in case props have changed
                patch(instance.vnode, vnode, container, anchor, instance, parentSuspense, isSVG, optimized);
                queuePostRenderEffect(() => {
                    instance.isDeactivated = false;
                    if (instance.a) {
                        invokeArrayFns(instance.a);
                    }
                    const vnodeHook = vnode.props && vnode.props.onVnodeMounted;
                    if (vnodeHook) {
                        invokeVNodeHook(vnodeHook, instance.parent, vnode);
                    }
                }, parentSuspense);
            };
            sharedContext.deactivate = (vnode) => {
                const instance = vnode.component;
                move(vnode, storageContainer, null, 1 /* LEAVE */, parentSuspense);
                queuePostRenderEffect(() => {
                    if (instance.da) {
                        invokeArrayFns(instance.da);
                    }
                    const vnodeHook = vnode.props && vnode.props.onVnodeUnmounted;
                    if (vnodeHook) {
                        invokeVNodeHook(vnodeHook, instance.parent, vnode);
                    }
                    instance.isDeactivated = true;
                }, parentSuspense);
            };
            function unmount(vnode) {
                // reset the shapeFlag so it can be properly unmounted
                resetShapeFlag(vnode);
                _unmount(vnode, instance, parentSuspense);
            }
            function pruneCache(filter) {
                cache.forEach((vnode, key) => {
                    const name = getComponentName(vnode.type);
                    if (name && (!filter || !filter(name))) {
                        pruneCacheEntry(key);
                    }
                });
            }
            function pruneCacheEntry(key) {
                const cached = cache.get(key);
                if (!current || cached.type !== current.type) {
                    unmount(cached);
                }
                else if (current) {
                    // current active instance should no longer be kept-alive.
                    // we can't unmount it now but it might be later, so reset its flag now.
                    resetShapeFlag(current);
                }
                cache.delete(key);
                keys.delete(key);
            }
            // prune cache on include/exclude prop change
            watch(() => [props.include, props.exclude], ([include, exclude]) => {
                include && pruneCache(name => matches(include, name));
                exclude && pruneCache(name => !matches(exclude, name));
            },
                // prune post-render after `current` has been updated
                { flush: 'post', deep: true });
            // cache sub tree after render
            let pendingCacheKey = null;
            const cacheSubtree = () => {
                // fix #1621, the pendingCacheKey could be 0
                if (pendingCacheKey != null) {
                    cache.set(pendingCacheKey, getInnerChild(instance.subTree));
                }
            };
            onMounted(cacheSubtree);
            onUpdated(cacheSubtree);
            onBeforeUnmount(() => {
                cache.forEach(cached => {
                    const { subTree, suspense } = instance;
                    const vnode = getInnerChild(subTree);
                    if (cached.type === vnode.type) {
                        // current instance will be unmounted as part of keep-alive's unmount
                        resetShapeFlag(vnode);
                        // but invoke its deactivated hook here
                        const da = vnode.component.da;
                        da && queuePostRenderEffect(da, suspense);
                        return;
                    }
                    unmount(cached);
                });
            });
            return () => {
                pendingCacheKey = null;
                if (!slots.default) {
                    return null;
                }
                const children = slots.default();
                const rawVNode = children[0];
                if (children.length > 1) {
                    {
                        warn(`KeepAlive should contain exactly one component child.`);
                    }
                    current = null;
                    return children;
                }
                else if (!isVNode(rawVNode) ||
                    (!(rawVNode.shapeFlag & 4 /* STATEFUL_COMPONENT */) &&
                        !(rawVNode.shapeFlag & 128 /* SUSPENSE */))) {
                    current = null;
                    return rawVNode;
                }
                let vnode = getInnerChild(rawVNode);
                const comp = vnode.type;
                const name = getComponentName(comp);
                const { include, exclude, max } = props;
                if ((include && (!name || !matches(include, name))) ||
                    (exclude && name && matches(exclude, name))) {
                    current = vnode;
                    return rawVNode;
                }
                const key = vnode.key == null ? comp : vnode.key;
                const cachedVNode = cache.get(key);
                // clone vnode if it's reused because we are going to mutate it
                if (vnode.el) {
                    vnode = cloneVNode(vnode);
                    if (rawVNode.shapeFlag & 128 /* SUSPENSE */) {
                        rawVNode.ssContent = vnode;
                    }
                }
                // #1513 it's possible for the returned vnode to be cloned due to attr
                // fallthrough or scopeId, so the vnode here may not be the final vnode
                // that is mounted. Instead of caching it directly, we store the pending
                // key and cache `instance.subTree` (the normalized vnode) in
                // beforeMount/beforeUpdate hooks.
                pendingCacheKey = key;
                if (cachedVNode) {
                    // copy over mounted state
                    vnode.el = cachedVNode.el;
                    vnode.component = cachedVNode.component;
                    if (vnode.transition) {
                        // recursively update transition hooks on subTree
                        setTransitionHooks(vnode, vnode.transition);
                    }
                    // avoid vnode being mounted as fresh
                    vnode.shapeFlag |= 512 /* COMPONENT_KEPT_ALIVE */;
                    // make this key the freshest
                    keys.delete(key);
                    keys.add(key);
                }
                else {
                    keys.add(key);
                    // prune oldest entry
                    if (max && keys.size > parseInt(max, 10)) {
                        pruneCacheEntry(keys.values().next().value);
                    }
                }
                // avoid vnode being unmounted
                vnode.shapeFlag |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
                current = vnode;
                return rawVNode;
            };
        }
    };
    // export the public type for h/tsx inference
    // also to avoid inline import() in generated d.ts files
    const KeepAlive = KeepAliveImpl;
    function matches(pattern, name) {
        if (isArray(pattern)) {
            return pattern.some((p) => matches(p, name));
        }
        else if (isString(pattern)) {
            return pattern.split(',').indexOf(name) > -1;
        }
        else if (pattern.test) {
            return pattern.test(name);
        }
        /* istanbul ignore next */
        return false;
    }
    function onActivated(hook, target) {
        registerKeepAliveHook(hook, "a" /* ACTIVATED */, target);
    }
    function onDeactivated(hook, target) {
        registerKeepAliveHook(hook, "da" /* DEACTIVATED */, target);
    }
    function registerKeepAliveHook(hook, type, target = currentInstance) {
        // cache the deactivate branch check wrapper for injected hooks so the same
        // hook can be properly deduped by the scheduler. "__wdc" stands for "with
        // deactivation check".
        const wrappedHook = hook.__wdc ||
            (hook.__wdc = () => {
                // only fire the hook if the target instance is NOT in a deactivated branch.
                let current = target;
                while (current) {
                    if (current.isDeactivated) {
                        return;
                    }
                    current = current.parent;
                }
                hook();
            });
        injectHook(type, wrappedHook, target);
        // In addition to registering it on the target instance, we walk up the parent
        // chain and register it on all ancestor instances that are keep-alive roots.
        // This avoids the need to walk the entire component tree when invoking these
        // hooks, and more importantly, avoids the need to track child components in
        // arrays.
        if (target) {
            let current = target.parent;
            while (current && current.parent) {
                if (isKeepAlive(current.parent.vnode)) {
                    injectToKeepAliveRoot(wrappedHook, type, target, current);
                }
                current = current.parent;
            }
        }
    }
    function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
        // injectHook wraps the original for error handling, so make sure to remove
        // the wrapped version.
        const injected = injectHook(type, hook, keepAliveRoot, true /* prepend */);
        onUnmounted(() => {
            remove(keepAliveRoot[type], injected);
        }, target);
    }
    function resetShapeFlag(vnode) {
        let shapeFlag = vnode.shapeFlag;
        if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
            shapeFlag -= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
        }
        if (shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
            shapeFlag -= 512 /* COMPONENT_KEPT_ALIVE */;
        }
        vnode.shapeFlag = shapeFlag;
    }
    function getInnerChild(vnode) {
        return vnode.shapeFlag & 128 /* SUSPENSE */ ? vnode.ssContent : vnode;
    }

    const isInternalKey = (key) => key[0] === '_' || key === '$stable';
    const normalizeSlotValue = (value) => isArray(value)
        ? value.map(normalizeVNode)
        : [normalizeVNode(value)];
    const normalizeSlot = (key, rawSlot, ctx) => withCtx((props) => {
        if (currentInstance) {
            warn(`Slot "${key}" invoked outside of the render function: ` +
                `this will not track dependencies used in the slot. ` +
                `Invoke the slot function inside the render function instead.`);
        }
        return normalizeSlotValue(rawSlot(props));
    }, ctx);
    const normalizeObjectSlots = (rawSlots, slots) => {
        const ctx = rawSlots._ctx;
        for (const key in rawSlots) {
            if (isInternalKey(key))
                continue;
            const value = rawSlots[key];
            if (isFunction(value)) {
                slots[key] = normalizeSlot(key, value, ctx);
            }
            else if (value != null) {
                {
                    warn(`Non-function value encountered for slot "${key}". ` +
                        `Prefer function slots for better performance.`);
                }
                const normalized = normalizeSlotValue(value);
                slots[key] = () => normalized;
            }
        }
    };
    const normalizeVNodeSlots = (instance, children) => {
        if (!isKeepAlive(instance.vnode)) {
            warn(`Non-function value encountered for default slot. ` +
                `Prefer function slots for better performance.`);
        }
        const normalized = normalizeSlotValue(children);
        instance.slots.default = () => normalized;
    };
    const initSlots = (instance, children) => {
        if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                instance.slots = children;
                // make compiler marker non-enumerable
                def(children, '_', type);
            }
            else {
                normalizeObjectSlots(children, (instance.slots = {}));
            }
        }
        else {
            instance.slots = {};
            if (children) {
                normalizeVNodeSlots(instance, children);
            }
        }
        def(instance.slots, InternalObjectKey, 1);
    };
    const updateSlots = (instance, children) => {
        const { vnode, slots } = instance;
        let needDeletionCheck = true;
        let deletionComparisonTarget = EMPTY_OBJ;
        if (vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                // compiled slots.
                if (isHmrUpdating) {
                    // Parent was HMR updated so slot content may have changed.
                    // force update slots and mark instance for hmr as well
                    extend(slots, children);
                }
                else if (type === 1 /* STABLE */) {
                    // compiled AND stable.
                    // no need to update, and skip stale slots removal.
                    needDeletionCheck = false;
                }
                else {
                    // compiled but dynamic (v-if/v-for on slots) - update slots, but skip
                    // normalization.
                    extend(slots, children);
                }
            }
            else {
                needDeletionCheck = !children.$stable;
                normalizeObjectSlots(children, slots);
            }
            deletionComparisonTarget = children;
        }
        else if (children) {
            // non slot object children (direct value) passed to a component
            normalizeVNodeSlots(instance, children);
            deletionComparisonTarget = { default: 1 };
        }
        // delete stale slots
        if (needDeletionCheck) {
            for (const key in slots) {
                if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
                    delete slots[key];
                }
            }
        }
    };

    /**
    Runtime helper for applying directives to a vnode. Example usage:
  
    const comp = resolveComponent('comp')
    const foo = resolveDirective('foo')
    const bar = resolveDirective('bar')
  
    return withDirectives(h(comp), [
      [foo, this.x],
      [bar, this.y]
    ])
    */
    const isBuiltInDirective = /*#__PURE__*/ makeMap('bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text');
    function validateDirectiveName(name) {
        if (isBuiltInDirective(name)) {
            warn('Do not use built-in directive ids as custom directive id: ' + name);
        }
    }
    /**
     * Adds directives to a VNode.
     */
    function withDirectives(vnode, directives) {
        const internalInstance = currentRenderingInstance;
        if (internalInstance === null) {
            warn(`withDirectives can only be used inside render functions.`);
            return vnode;
        }
        const instance = internalInstance.proxy;
        const bindings = vnode.dirs || (vnode.dirs = []);
        for (let i = 0; i < directives.length; i++) {
            let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
            if (isFunction(dir)) {
                dir = {
                    mounted: dir,
                    updated: dir
                };
            }
            bindings.push({
                dir,
                instance,
                value,
                oldValue: void 0,
                arg,
                modifiers
            });
        }
        return vnode;
    }
    function invokeDirectiveHook(vnode, prevVNode, instance, name) {
        const bindings = vnode.dirs;
        const oldBindings = prevVNode && prevVNode.dirs;
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            if (oldBindings) {
                binding.oldValue = oldBindings[i].value;
            }
            const hook = binding.dir[name];
            if (hook) {
                callWithAsyncErrorHandling(hook, instance, 8 /* DIRECTIVE_HOOK */, [
                    vnode.el,
                    binding,
                    vnode,
                    prevVNode
                ]);
            }
        }
    }

    function createAppContext() {
        return {
            app: null,
            config: {
                isNativeTag: NO,
                performance: false,
                globalProperties: {},
                optionMergeStrategies: {},
                isCustomElement: NO,
                errorHandler: undefined,
                warnHandler: undefined
            },
            mixins: [],
            components: {},
            directives: {},
            provides: Object.create(null)
        };
    }
    let uid$1 = 0;
    function createAppAPI(render, hydrate) {
        return function createApp(rootComponent, rootProps = null) {
            if (rootProps != null && !isObject(rootProps)) {
                warn(`root props passed to app.mount() must be an object.`);
                rootProps = null;
            }
            const context = createAppContext();
            const installedPlugins = new Set();
            let isMounted = false;
            const app = (context.app = {
                _uid: uid$1++,
                _component: rootComponent,
                _props: rootProps,
                _container: null,
                _context: context,
                version,
                get config() {
                    return context.config;
                },
                set config(v) {
                    {
                        warn(`app.config cannot be replaced. Modify individual options instead.`);
                    }
                },
                use(plugin, ...options) {
                    if (installedPlugins.has(plugin)) {
                        warn(`Plugin has already been applied to target app.`);
                    }
                    else if (plugin && isFunction(plugin.install)) {
                        installedPlugins.add(plugin);
                        plugin.install(app, ...options);
                    }
                    else if (isFunction(plugin)) {
                        installedPlugins.add(plugin);
                        plugin(app, ...options);
                    }
                    else {
                        warn(`A plugin must either be a function or an object with an "install" ` +
                            `function.`);
                    }
                    return app;
                },
                mixin(mixin) {
                    {
                        if (!context.mixins.includes(mixin)) {
                            context.mixins.push(mixin);
                            // global mixin with props/emits de-optimizes props/emits
                            // normalization caching.
                            if (mixin.props || mixin.emits) {
                                context.deopt = true;
                            }
                        }
                        else {
                            warn('Mixin has already been applied to target app' +
                                (mixin.name ? `: ${mixin.name}` : ''));
                        }
                    }
                    return app;
                },
                component(name, component) {
                    {
                        validateComponentName(name, context.config);
                    }
                    if (!component) {
                        return context.components[name];
                    }
                    if (context.components[name]) {
                        warn(`Component "${name}" has already been registered in target app.`);
                    }
                    context.components[name] = component;
                    return app;
                },
                directive(name, directive) {
                    {
                        validateDirectiveName(name);
                    }
                    if (!directive) {
                        return context.directives[name];
                    }
                    if (context.directives[name]) {
                        warn(`Directive "${name}" has already been registered in target app.`);
                    }
                    context.directives[name] = directive;
                    return app;
                },
                mount(rootContainer, isHydrate) {
                    if (!isMounted) {
                        const vnode = createVNode(rootComponent, rootProps);
                        // store app context on the root VNode.
                        // this will be set on the root instance on initial mount.
                        vnode.appContext = context;
                        // HMR root reload
                        {
                            context.reload = () => {
                                render(cloneVNode(vnode), rootContainer);
                            };
                        }
                        if (isHydrate && hydrate) {
                            hydrate(vnode, rootContainer);
                        }
                        else {
                            render(vnode, rootContainer);
                        }
                        isMounted = true;
                        app._container = rootContainer;
                        rootContainer.__vue_app__ = app;
                        {
                            devtoolsInitApp(app, version);
                        }
                        return vnode.component.proxy;
                    }
                    else {
                        warn(`App has already been mounted.\n` +
                            `If you want to remount the same app, move your app creation logic ` +
                            `into a factory function and create fresh app instances for each ` +
                            `mount - e.g. \`const createMyApp = () => createApp(App)\``);
                    }
                },
                unmount() {
                    if (isMounted) {
                        render(null, app._container);
                        {
                            devtoolsUnmountApp(app);
                        }
                        delete app._container.__vue_app__;
                    }
                    else {
                        warn(`Cannot unmount an app that is not mounted.`);
                    }
                },
                provide(key, value) {
                    if (key in context.provides) {
                        warn(`App already provides property with key "${String(key)}". ` +
                            `It will be overwritten with the new value.`);
                    }
                    // TypeScript doesn't allow symbols as index type
                    // https://github.com/Microsoft/TypeScript/issues/24587
                    context.provides[key] = value;
                    return app;
                }
            });
            return app;
        };
    }

    let hasMismatch = false;
    const isSVGContainer = (container) => /svg/.test(container.namespaceURI) && container.tagName !== 'foreignObject';
    const isComment = (node) => node.nodeType === 8 /* COMMENT */;
    // Note: hydration is DOM-specific
    // But we have to place it in core due to tight coupling with core - splitting
    // it out creates a ton of unnecessary complexity.
    // Hydration also depends on some renderer internal logic which needs to be
    // passed in via arguments.
    function createHydrationFunctions(rendererInternals) {
        const { mt: mountComponent, p: patch, o: { patchProp, nextSibling, parentNode, remove, insert, createComment } } = rendererInternals;
        const hydrate = (vnode, container) => {
            if (!container.hasChildNodes()) {
                warn(`Attempting to hydrate existing markup but container is empty. ` +
                    `Performing full mount instead.`);
                patch(null, vnode, container);
                return;
            }
            hasMismatch = false;
            hydrateNode(container.firstChild, vnode, null, null);
            flushPostFlushCbs();
            if (hasMismatch && !false) {
                // this error should show up in production
                console.error(`Hydration completed but contains mismatches.`);
            }
        };
        const hydrateNode = (node, vnode, parentComponent, parentSuspense, optimized = false) => {
            const isFragmentStart = isComment(node) && node.data === '[';
            const onMismatch = () => handleMismatch(node, vnode, parentComponent, parentSuspense, isFragmentStart);
            const { type, ref, shapeFlag } = vnode;
            const domType = node.nodeType;
            vnode.el = node;
            let nextNode = null;
            switch (type) {
                case Text:
                    if (domType !== 3 /* TEXT */) {
                        nextNode = onMismatch();
                    }
                    else {
                        if (node.data !== vnode.children) {
                            hasMismatch = true;
                            warn(`Hydration text mismatch:` +
                                `\n- Client: ${JSON.stringify(node.data)}` +
                                `\n- Server: ${JSON.stringify(vnode.children)}`);
                            node.data = vnode.children;
                        }
                        nextNode = nextSibling(node);
                    }
                    break;
                case Comment:
                    if (domType !== 8 /* COMMENT */ || isFragmentStart) {
                        nextNode = onMismatch();
                    }
                    else {
                        nextNode = nextSibling(node);
                    }
                    break;
                case Static:
                    if (domType !== 1 /* ELEMENT */) {
                        nextNode = onMismatch();
                    }
                    else {
                        // determine anchor, adopt content
                        nextNode = node;
                        // if the static vnode has its content stripped during build,
                        // adopt it from the server-rendered HTML.
                        const needToAdoptContent = !vnode.children.length;
                        for (let i = 0; i < vnode.staticCount; i++) {
                            if (needToAdoptContent)
                                vnode.children += nextNode.outerHTML;
                            if (i === vnode.staticCount - 1) {
                                vnode.anchor = nextNode;
                            }
                            nextNode = nextSibling(nextNode);
                        }
                        return nextNode;
                    }
                    break;
                case Fragment:
                    if (!isFragmentStart) {
                        nextNode = onMismatch();
                    }
                    else {
                        nextNode = hydrateFragment(node, vnode, parentComponent, parentSuspense, optimized);
                    }
                    break;
                default:
                    if (shapeFlag & 1 /* ELEMENT */) {
                        if (domType !== 1 /* ELEMENT */ ||
                            vnode.type !== node.tagName.toLowerCase()) {
                            nextNode = onMismatch();
                        }
                        else {
                            nextNode = hydrateElement(node, vnode, parentComponent, parentSuspense, optimized);
                        }
                    }
                    else if (shapeFlag & 6 /* COMPONENT */) {
                        // when setting up the render effect, if the initial vnode already
                        // has .el set, the component will perform hydration instead of mount
                        // on its sub-tree.
                        const container = parentNode(node);
                        const hydrateComponent = () => {
                            mountComponent(vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container), optimized);
                        };
                        // async component
                        const loadAsync = vnode.type.__asyncLoader;
                        if (loadAsync) {
                            loadAsync().then(hydrateComponent);
                        }
                        else {
                            hydrateComponent();
                        }
                        // component may be async, so in the case of fragments we cannot rely
                        // on component's rendered output to determine the end of the fragment
                        // instead, we do a lookahead to find the end anchor node.
                        nextNode = isFragmentStart
                            ? locateClosingAsyncAnchor(node)
                            : nextSibling(node);
                    }
                    else if (shapeFlag & 64 /* TELEPORT */) {
                        if (domType !== 8 /* COMMENT */) {
                            nextNode = onMismatch();
                        }
                        else {
                            nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, optimized, rendererInternals, hydrateChildren);
                        }
                    }
                    else if (shapeFlag & 128 /* SUSPENSE */) {
                        nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, isSVGContainer(parentNode(node)), optimized, rendererInternals, hydrateNode);
                    }
                    else {
                        warn('Invalid HostVNode type:', type, `(${typeof type})`);
                    }
            }
            if (ref != null) {
                setRef(ref, null, parentSuspense, vnode);
            }
            return nextNode;
        };
        const hydrateElement = (el, vnode, parentComponent, parentSuspense, optimized) => {
            optimized = optimized || !!vnode.dynamicChildren;
            const { props, patchFlag, shapeFlag, dirs } = vnode;
            // skip props & children if this is hoisted static nodes
            if (patchFlag !== -1 /* HOISTED */) {
                if (dirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'created');
                }
                // props
                if (props) {
                    if (!optimized ||
                        (patchFlag & 16 /* FULL_PROPS */ ||
                            patchFlag & 32 /* HYDRATE_EVENTS */)) {
                        for (const key in props) {
                            if (!isReservedProp(key) && isOn(key)) {
                                patchProp(el, key, null, props[key]);
                            }
                        }
                    }
                    else if (props.onClick) {
                        // Fast path for click listeners (which is most often) to avoid
                        // iterating through props.
                        patchProp(el, 'onClick', null, props.onClick);
                    }
                }
                // vnode / directive hooks
                let vnodeHooks;
                if ((vnodeHooks = props && props.onVnodeBeforeMount)) {
                    invokeVNodeHook(vnodeHooks, parentComponent, vnode);
                }
                if (dirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
                }
                if ((vnodeHooks = props && props.onVnodeMounted) || dirs) {
                    queueEffectWithSuspense(() => {
                        vnodeHooks && invokeVNodeHook(vnodeHooks, parentComponent, vnode);
                        dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
                    }, parentSuspense);
                }
                // children
                if (shapeFlag & 16 /* ARRAY_CHILDREN */ &&
                    // skip if element has innerHTML / textContent
                    !(props && (props.innerHTML || props.textContent))) {
                    let next = hydrateChildren(el.firstChild, vnode, el, parentComponent, parentSuspense, optimized);
                    let hasWarned = false;
                    while (next) {
                        hasMismatch = true;
                        if (!hasWarned) {
                            warn(`Hydration children mismatch in <${vnode.type}>: ` +
                                `server rendered element contains more child nodes than client vdom.`);
                            hasWarned = true;
                        }
                        // The SSRed DOM contains more nodes than it should. Remove them.
                        const cur = next;
                        next = next.nextSibling;
                        remove(cur);
                    }
                }
                else if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                    if (el.textContent !== vnode.children) {
                        hasMismatch = true;
                        warn(`Hydration text content mismatch in <${vnode.type}>:\n` +
                            `- Client: ${el.textContent}\n` +
                            `- Server: ${vnode.children}`);
                        el.textContent = vnode.children;
                    }
                }
            }
            return el.nextSibling;
        };
        const hydrateChildren = (node, parentVNode, container, parentComponent, parentSuspense, optimized) => {
            optimized = optimized || !!parentVNode.dynamicChildren;
            const children = parentVNode.children;
            const l = children.length;
            let hasWarned = false;
            for (let i = 0; i < l; i++) {
                const vnode = optimized
                    ? children[i]
                    : (children[i] = normalizeVNode(children[i]));
                if (node) {
                    node = hydrateNode(node, vnode, parentComponent, parentSuspense, optimized);
                }
                else {
                    hasMismatch = true;
                    if (!hasWarned) {
                        warn(`Hydration children mismatch in <${container.tagName.toLowerCase()}>: ` +
                            `server rendered element contains fewer child nodes than client vdom.`);
                        hasWarned = true;
                    }
                    // the SSRed DOM didn't contain enough nodes. Mount the missing ones.
                    patch(null, vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container));
                }
            }
            return node;
        };
        const hydrateFragment = (node, vnode, parentComponent, parentSuspense, optimized) => {
            const container = parentNode(node);
            const next = hydrateChildren(nextSibling(node), vnode, container, parentComponent, parentSuspense, optimized);
            if (next && isComment(next) && next.data === ']') {
                return nextSibling((vnode.anchor = next));
            }
            else {
                // fragment didn't hydrate successfully, since we didn't get a end anchor
                // back. This should have led to node/children mismatch warnings.
                hasMismatch = true;
                // since the anchor is missing, we need to create one and insert it
                insert((vnode.anchor = createComment(`]`)), container, next);
                return next;
            }
        };
        const handleMismatch = (node, vnode, parentComponent, parentSuspense, isFragment) => {
            hasMismatch = true;
            warn(`Hydration node mismatch:\n- Client vnode:`, vnode.type, `\n- Server rendered DOM:`, node, node.nodeType === 3 /* TEXT */
                ? `(text)`
                : isComment(node) && node.data === '['
                    ? `(start of fragment)`
                    : ``);
            vnode.el = null;
            if (isFragment) {
                // remove excessive fragment nodes
                const end = locateClosingAsyncAnchor(node);
                while (true) {
                    const next = nextSibling(node);
                    if (next && next !== end) {
                        remove(next);
                    }
                    else {
                        break;
                    }
                }
            }
            const next = nextSibling(node);
            const container = parentNode(node);
            remove(node);
            patch(null, vnode, container, next, parentComponent, parentSuspense, isSVGContainer(container));
            return next;
        };
        const locateClosingAsyncAnchor = (node) => {
            let match = 0;
            while (node) {
                node = nextSibling(node);
                if (node && isComment(node)) {
                    if (node.data === '[')
                        match++;
                    if (node.data === ']') {
                        if (match === 0) {
                            return nextSibling(node);
                        }
                        else {
                            match--;
                        }
                    }
                }
            }
            return node;
        };
        return [hydrate, hydrateNode];
    }

    let supported;
    let perf;
    function startMeasure(instance, type) {
        if (instance.appContext.config.performance && isSupported()) {
            perf.mark(`vue-${type}-${instance.uid}`);
        }
    }
    function endMeasure(instance, type) {
        if (instance.appContext.config.performance && isSupported()) {
            const startTag = `vue-${type}-${instance.uid}`;
            const endTag = startTag + `:end`;
            perf.mark(endTag);
            perf.measure(`<${formatComponentName(instance, instance.type)}> ${type}`, startTag, endTag);
            perf.clearMarks(startTag);
            perf.clearMarks(endTag);
        }
    }
    function isSupported() {
        if (supported !== undefined) {
            return supported;
        }
        /* eslint-disable no-restricted-globals */
        if (typeof window !== 'undefined' && window.performance) {
            supported = true;
            perf = window.performance;
        }
        else {
            supported = false;
        }
        /* eslint-enable no-restricted-globals */
        return supported;
    }

    // implementation, close to no-op
    function defineComponent(options) {
        return isFunction(options) ? { setup: options, name: options.name } : options;
    }

    const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
    function defineAsyncComponent(source) {
        if (isFunction(source)) {
            source = { loader: source };
        }
        const { loader, loadingComponent, errorComponent, delay = 200, timeout, // undefined = never times out
            suspensible = true, onError: userOnError } = source;
        let pendingRequest = null;
        let resolvedComp;
        let retries = 0;
        const retry = () => {
            retries++;
            pendingRequest = null;
            return load();
        };
        const load = () => {
            let thisRequest;
            return (pendingRequest ||
                (thisRequest = pendingRequest = loader()
                    .catch(err => {
                        err = err instanceof Error ? err : new Error(String(err));
                        if (userOnError) {
                            return new Promise((resolve, reject) => {
                                const userRetry = () => resolve(retry());
                                const userFail = () => reject(err);
                                userOnError(err, userRetry, userFail, retries + 1);
                            });
                        }
                        else {
                            throw err;
                        }
                    })
                    .then((comp) => {
                        if (thisRequest !== pendingRequest && pendingRequest) {
                            return pendingRequest;
                        }
                        if (!comp) {
                            warn(`Async component loader resolved to undefined. ` +
                                `If you are using retry(), make sure to return its return value.`);
                        }
                        // interop module default
                        if (comp &&
                            (comp.__esModule || comp[Symbol.toStringTag] === 'Module')) {
                            comp = comp.default;
                        }
                        if (comp && !isObject(comp) && !isFunction(comp)) {
                            throw new Error(`Invalid async component load result: ${comp}`);
                        }
                        resolvedComp = comp;
                        return comp;
                    })));
        };
        return defineComponent({
            __asyncLoader: load,
            name: 'AsyncComponentWrapper',
            setup() {
                const instance = currentInstance;
                // already resolved
                if (resolvedComp) {
                    return () => createInnerComp(resolvedComp, instance);
                }
                const onError = (err) => {
                    pendingRequest = null;
                    handleError(err, instance, 13 /* ASYNC_COMPONENT_LOADER */, !errorComponent /* do not throw in dev if user provided error component */);
                };
                // suspense-controlled or SSR.
                if ((suspensible && instance.suspense) ||
                    (false)) {
                    return load()
                        .then(comp => {
                            return () => createInnerComp(comp, instance);
                        })
                        .catch(err => {
                            onError(err);
                            return () => errorComponent
                                ? createVNode(errorComponent, {
                                    error: err
                                })
                                : null;
                        });
                }
                const loaded = ref(false);
                const error = ref();
                const delayed = ref(!!delay);
                if (delay) {
                    setTimeout(() => {
                        delayed.value = false;
                    }, delay);
                }
                if (timeout != null) {
                    setTimeout(() => {
                        if (!loaded.value && !error.value) {
                            const err = new Error(`Async component timed out after ${timeout}ms.`);
                            onError(err);
                            error.value = err;
                        }
                    }, timeout);
                }
                load()
                    .then(() => {
                        loaded.value = true;
                    })
                    .catch(err => {
                        onError(err);
                        error.value = err;
                    });
                return () => {
                    if (loaded.value && resolvedComp) {
                        return createInnerComp(resolvedComp, instance);
                    }
                    else if (error.value && errorComponent) {
                        return createVNode(errorComponent, {
                            error: error.value
                        });
                    }
                    else if (loadingComponent && !delayed.value) {
                        return createVNode(loadingComponent);
                    }
                };
            }
        });
    }
    function createInnerComp(comp, { vnode: { ref, props, children } }) {
        const vnode = createVNode(comp, props, children);
        // ensure inner component inherits the async wrapper's ref owner
        vnode.ref = ref;
        return vnode;
    }

    function createDevEffectOptions(instance) {
        return {
            scheduler: queueJob,
            allowRecurse: true,
            onTrack: instance.rtc ? e => invokeArrayFns(instance.rtc, e) : void 0,
            onTrigger: instance.rtg ? e => invokeArrayFns(instance.rtg, e) : void 0
        };
    }
    const queuePostRenderEffect = queueEffectWithSuspense
        ;
    const setRef = (rawRef, oldRawRef, parentSuspense, vnode) => {
        if (isArray(rawRef)) {
            rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode));
            return;
        }
        let value;
        if (!vnode || isAsyncWrapper(vnode)) {
            value = null;
        }
        else {
            if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                value = vnode.component.exposed || vnode.component.proxy;
            }
            else {
                value = vnode.el;
            }
        }
        const { i: owner, r: ref } = rawRef;
        if (!owner) {
            warn(`Missing ref owner context. ref cannot be used on hoisted vnodes. ` +
                `A vnode with ref must be created inside the render function.`);
            return;
        }
        const oldRef = oldRawRef && oldRawRef.r;
        const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs;
        const setupState = owner.setupState;
        // unset old ref
        if (oldRef != null && oldRef !== ref) {
            if (isString(oldRef)) {
                refs[oldRef] = null;
                if (hasOwn(setupState, oldRef)) {
                    setupState[oldRef] = null;
                }
            }
            else if (isRef(oldRef)) {
                oldRef.value = null;
            }
        }
        if (isString(ref)) {
            const doSet = () => {
                refs[ref] = value;
                if (hasOwn(setupState, ref)) {
                    setupState[ref] = value;
                }
            };
            // #1789: for non-null values, set them after render
            // null values means this is unmount and it should not overwrite another
            // ref with the same key
            if (value) {
                doSet.id = -1;
                queuePostRenderEffect(doSet, parentSuspense);
            }
            else {
                doSet();
            }
        }
        else if (isRef(ref)) {
            const doSet = () => {
                ref.value = value;
            };
            if (value) {
                doSet.id = -1;
                queuePostRenderEffect(doSet, parentSuspense);
            }
            else {
                doSet();
            }
        }
        else if (isFunction(ref)) {
            callWithErrorHandling(ref, owner, 12 /* FUNCTION_REF */, [value, refs]);
        }
        else {
            warn('Invalid template ref type:', value, `(${typeof value})`);
        }
    };
    /**
     * The createRenderer function accepts two generic arguments:
     * HostNode and HostElement, corresponding to Node and Element types in the
     * host environment. For example, for runtime-dom, HostNode would be the DOM
     * `Node` interface and HostElement would be the DOM `Element` interface.
     *
     * Custom renderers can pass in the platform specific types like this:
     *
     * ``` js
     * const { render, createApp } = createRenderer<Node, Element>({
     *   patchProp,
     *   ...nodeOps
     * })
     * ```
     */
    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    // Separate API for creating hydration-enabled renderer.
    // Hydration logic is only used when calling this function, making it
    // tree-shakable.
    function createHydrationRenderer(options) {
        return baseCreateRenderer(options, createHydrationFunctions);
    }
    // implementation
    function baseCreateRenderer(options, createHydrationFns) {
        {
            const target = getGlobalThis();
            target.__VUE__ = true;
            setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__);
        }
        const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, forcePatchProp: hostForcePatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, cloneNode: hostCloneNode, insertStaticContent: hostInsertStaticContent } = options;
        // Note: functions inside this closure should use `const xxx = () => {}`
        // style in order to prevent being inlined by minifiers.
        const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, optimized = false) => {
            // patching & not same type, unmount old tree
            if (n1 && !isSameVNodeType(n1, n2)) {
                anchor = getNextHostNode(n1);
                unmount(n1, parentComponent, parentSuspense, true);
                n1 = null;
            }
            if (n2.patchFlag === -2 /* BAIL */) {
                optimized = false;
                n2.dynamicChildren = null;
            }
            const { type, ref, shapeFlag } = n2;
            switch (type) {
                case Text:
                    processText(n1, n2, container, anchor);
                    break;
                case Comment:
                    processCommentNode(n1, n2, container, anchor);
                    break;
                case Static:
                    if (n1 == null) {
                        mountStaticNode(n2, container, anchor, isSVG);
                    }
                    else {
                        patchStaticNode(n1, n2, container, isSVG);
                    }
                    break;
                case Fragment:
                    processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    break;
                default:
                    if (shapeFlag & 1 /* ELEMENT */) {
                        processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                    else if (shapeFlag & 6 /* COMPONENT */) {
                        processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                    else if (shapeFlag & 64 /* TELEPORT */) {
                        type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals);
                    }
                    else if (shapeFlag & 128 /* SUSPENSE */) {
                        type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals);
                    }
                    else {
                        warn('Invalid VNode type:', type, `(${typeof type})`);
                    }
            }
            // set ref
            if (ref != null && parentComponent) {
                setRef(ref, n1 && n1.ref, parentSuspense, n2);
            }
        };
        const processText = (n1, n2, container, anchor) => {
            if (n1 == null) {
                hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
            }
            else {
                const el = (n2.el = n1.el);
                if (n2.children !== n1.children) {
                    hostSetText(el, n2.children);
                }
            }
        };
        const processCommentNode = (n1, n2, container, anchor) => {
            if (n1 == null) {
                hostInsert((n2.el = hostCreateComment(n2.children || '')), container, anchor);
            }
            else {
                // there's no support for dynamic comments
                n2.el = n1.el;
            }
        };
        const mountStaticNode = (n2, container, anchor, isSVG) => {
            [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG);
        };
        /**
         * Dev / HMR only
         */
        const patchStaticNode = (n1, n2, container, isSVG) => {
            // static nodes are only patched during dev for HMR
            if (n2.children !== n1.children) {
                const anchor = hostNextSibling(n1.anchor);
                // remove existing
                removeStaticNode(n1);
                [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG);
            }
            else {
                n2.el = n1.el;
                n2.anchor = n1.anchor;
            }
        };
        const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
            let next;
            while (el && el !== anchor) {
                next = hostNextSibling(el);
                hostInsert(el, container, nextSibling);
                el = next;
            }
            hostInsert(anchor, container, nextSibling);
        };
        const removeStaticNode = ({ el, anchor }) => {
            let next;
            while (el && el !== anchor) {
                next = hostNextSibling(el);
                hostRemove(el);
                el = next;
            }
            hostRemove(anchor);
        };
        const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            isSVG = isSVG || n2.type === 'svg';
            if (n1 == null) {
                mountElement(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
            }
            else {
                patchElement(n1, n2, parentComponent, parentSuspense, isSVG, optimized);
            }
        };
        const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            let el;
            let vnodeHook;
            const { type, props, shapeFlag, transition, scopeId, patchFlag, dirs } = vnode;
            {
                el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is);
                // mount children first, since some props may rely on child content
                // being already rendered, e.g. `<select value>`
                if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                    hostSetElementText(el, vnode.children);
                }
                else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    mountChildren(vnode.children, el, null, parentComponent, parentSuspense, isSVG && type !== 'foreignObject', optimized || !!vnode.dynamicChildren);
                }
                if (dirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'created');
                }
                // props
                if (props) {
                    for (const key in props) {
                        if (!isReservedProp(key)) {
                            hostPatchProp(el, key, null, props[key], isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                        }
                    }
                    if ((vnodeHook = props.onVnodeBeforeMount)) {
                        invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    }
                }
                // scopeId
                setScopeId(el, scopeId, vnode, parentComponent);
            }
            {
                Object.defineProperty(el, '__vnode', {
                    value: vnode,
                    enumerable: false
                });
                Object.defineProperty(el, '__vueParentComponent', {
                    value: parentComponent,
                    enumerable: false
                });
            }
            if (dirs) {
                invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
            }
            // #1583 For inside suspense + suspense not resolved case, enter hook should call when suspense resolved
            // #1689 For inside suspense + suspense resolved case, just call it
            const needCallTransitionHooks = (!parentSuspense || (parentSuspense && !parentSuspense.pendingBranch)) &&
                transition &&
                !transition.persisted;
            if (needCallTransitionHooks) {
                transition.beforeEnter(el);
            }
            hostInsert(el, container, anchor);
            if ((vnodeHook = props && props.onVnodeMounted) ||
                needCallTransitionHooks ||
                dirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    needCallTransitionHooks && transition.enter(el);
                    dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
                }, parentSuspense);
            }
        };
        const setScopeId = (el, scopeId, vnode, parentComponent) => {
            if (scopeId) {
                hostSetScopeId(el, scopeId);
            }
            if (parentComponent) {
                const treeOwnerId = parentComponent.type.__scopeId;
                // vnode's own scopeId and the current patched component's scopeId is
                // different - this is a slot content node.
                if (treeOwnerId && treeOwnerId !== scopeId) {
                    hostSetScopeId(el, treeOwnerId + '-s');
                }
                let subTree = parentComponent.subTree;
                if (subTree.type === Fragment) {
                    subTree =
                        filterSingleRoot(subTree.children) || subTree;
                }
                if (vnode === subTree) {
                    setScopeId(el, parentComponent.vnode.scopeId, parentComponent.vnode, parentComponent.parent);
                }
            }
        };
        const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, optimized, start = 0) => {
            for (let i = start; i < children.length; i++) {
                const child = (children[i] = optimized
                    ? cloneIfMounted(children[i])
                    : normalizeVNode(children[i]));
                patch(null, child, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
            }
        };
        const patchElement = (n1, n2, parentComponent, parentSuspense, isSVG, optimized) => {
            const el = (n2.el = n1.el);
            let { patchFlag, dynamicChildren, dirs } = n2;
            // #1426 take the old vnode's patch flag into account since user may clone a
            // compiler-generated vnode, which de-opts to FULL_PROPS
            patchFlag |= n1.patchFlag & 16 /* FULL_PROPS */;
            const oldProps = n1.props || EMPTY_OBJ;
            const newProps = n2.props || EMPTY_OBJ;
            let vnodeHook;
            if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
                invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
            }
            if (dirs) {
                invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
            }
            if (isHmrUpdating) {
                // HMR updated, force full diff
                patchFlag = 0;
                optimized = false;
                dynamicChildren = null;
            }
            if (patchFlag > 0) {
                // the presence of a patchFlag means this element's render code was
                // generated by the compiler and can take the fast path.
                // in this path old node and new node are guaranteed to have the same shape
                // (i.e. at the exact same position in the source template)
                if (patchFlag & 16 /* FULL_PROPS */) {
                    // element props contain dynamic keys, full diff needed
                    patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
                }
                else {
                    // class
                    // this flag is matched when the element has dynamic class bindings.
                    if (patchFlag & 2 /* CLASS */) {
                        if (oldProps.class !== newProps.class) {
                            hostPatchProp(el, 'class', null, newProps.class, isSVG);
                        }
                    }
                    // style
                    // this flag is matched when the element has dynamic style bindings
                    if (patchFlag & 4 /* STYLE */) {
                        hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG);
                    }
                    // props
                    // This flag is matched when the element has dynamic prop/attr bindings
                    // other than class and style. The keys of dynamic prop/attrs are saved for
                    // faster iteration.
                    // Note dynamic keys like :[foo]="bar" will cause this optimization to
                    // bail out and go through a full diff because we need to unset the old key
                    if (patchFlag & 8 /* PROPS */) {
                        // if the flag is present then dynamicProps must be non-null
                        const propsToUpdate = n2.dynamicProps;
                        for (let i = 0; i < propsToUpdate.length; i++) {
                            const key = propsToUpdate[i];
                            const prev = oldProps[key];
                            const next = newProps[key];
                            if (next !== prev ||
                                (hostForcePatchProp && hostForcePatchProp(el, key))) {
                                hostPatchProp(el, key, prev, next, isSVG, n1.children, parentComponent, parentSuspense, unmountChildren);
                            }
                        }
                    }
                }
                // text
                // This flag is matched when the element has only dynamic text children.
                if (patchFlag & 1 /* TEXT */) {
                    if (n1.children !== n2.children) {
                        hostSetElementText(el, n2.children);
                    }
                }
            }
            else if (!optimized && dynamicChildren == null) {
                // unoptimized, full diff
                patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
            }
            const areChildrenSVG = isSVG && n2.type !== 'foreignObject';
            if (dynamicChildren) {
                patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, areChildrenSVG);
                if (parentComponent && parentComponent.type.__hmrId) {
                    traverseStaticChildren(n1, n2);
                }
            }
            else if (!optimized) {
                // full diff
                patchChildren(n1, n2, el, null, parentComponent, parentSuspense, areChildrenSVG);
            }
            if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
                    dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated');
                }, parentSuspense);
            }
        };
        // The fast path for blocks.
        const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, isSVG) => {
            for (let i = 0; i < newChildren.length; i++) {
                const oldVNode = oldChildren[i];
                const newVNode = newChildren[i];
                // Determine the container (parent element) for the patch.
                const container =
                    // - In the case of a Fragment, we need to provide the actual parent
                    // of the Fragment itself so it can move its children.
                    oldVNode.type === Fragment ||
                        // - In the case of different nodes, there is going to be a replacement
                        // which also requires the correct parent container
                        !isSameVNodeType(oldVNode, newVNode) ||
                        // - In the case of a component, it could contain anything.
                        oldVNode.shapeFlag & 6 /* COMPONENT */ ||
                        oldVNode.shapeFlag & 64 /* TELEPORT */
                        ? hostParentNode(oldVNode.el)
                        : // In other cases, the parent container is not actually used so we
                        // just pass the block element here to avoid a DOM parentNode call.
                        fallbackContainer;
                patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, isSVG, true);
            }
        };
        const patchProps = (el, vnode, oldProps, newProps, parentComponent, parentSuspense, isSVG) => {
            if (oldProps !== newProps) {
                for (const key in newProps) {
                    // empty string is not valid prop
                    if (isReservedProp(key))
                        continue;
                    const next = newProps[key];
                    const prev = oldProps[key];
                    if (next !== prev ||
                        (hostForcePatchProp && hostForcePatchProp(el, key))) {
                        hostPatchProp(el, key, prev, next, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                    }
                }
                if (oldProps !== EMPTY_OBJ) {
                    for (const key in oldProps) {
                        if (!isReservedProp(key) && !(key in newProps)) {
                            hostPatchProp(el, key, oldProps[key], null, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                        }
                    }
                }
            }
        };
        const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
            const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));
            let { patchFlag, dynamicChildren } = n2;
            if (patchFlag > 0) {
                optimized = true;
            }
            if (isHmrUpdating) {
                // HMR updated, force full diff
                patchFlag = 0;
                optimized = false;
                dynamicChildren = null;
            }
            if (n1 == null) {
                hostInsert(fragmentStartAnchor, container, anchor);
                hostInsert(fragmentEndAnchor, container, anchor);
                // a fragment can only have array children
                // since they are either generated by the compiler, or implicitly created
                // from arrays.
                mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, optimized);
            }
            else {
                if (patchFlag > 0 &&
                    patchFlag & 64 /* STABLE_FRAGMENT */ &&
                    dynamicChildren &&
                    // #2715 the previous fragment could've been a BAILed one as a result
                    // of renderSlot() with no valid children
                    n1.dynamicChildren) {
                    // a stable fragment (template root or <template v-for>) doesn't need to
                    // patch children order, but it may contain dynamicChildren.
                    patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG);
                    if (parentComponent && parentComponent.type.__hmrId) {
                        traverseStaticChildren(n1, n2);
                    }
                    else if (
                        // #2080 if the stable fragment has a key, it's a <template v-for> that may
                        //  get moved around. Make sure all root level vnodes inherit el.
                        // #2134 or if it's a component root, it may also get moved around
                        // as the component is being moved.
                        n2.key != null ||
                        (parentComponent && n2 === parentComponent.subTree)) {
                        traverseStaticChildren(n1, n2, true /* shallow */);
                    }
                }
                else {
                    // keyed / unkeyed, or manual fragments.
                    // for keyed & unkeyed, since they are compiler generated from v-for,
                    // each child is guaranteed to be a block so the fragment will never
                    // have dynamicChildren.
                    patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, optimized);
                }
            }
        };
        const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            if (n1 == null) {
                if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
                    parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized);
                }
                else {
                    mountComponent(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                }
            }
            else {
                updateComponent(n1, n2, optimized);
            }
        };
        const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense));
            if (instance.type.__hmrId) {
                registerHMR(instance);
            }
            {
                pushWarningContext(initialVNode);
                startMeasure(instance, `mount`);
            }
            // inject renderer internals for keepAlive
            if (isKeepAlive(initialVNode)) {
                instance.ctx.renderer = internals;
            }
            // resolve props and slots for setup context
            {
                startMeasure(instance, `init`);
            }
            setupComponent(instance);
            {
                endMeasure(instance, `init`);
            }
            // setup() is async. This component relies on async logic to be resolved
            // before proceeding
            if (instance.asyncDep) {
                parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
                // Give it a placeholder if this is not hydration
                // TODO handle self-defined fallback
                if (!initialVNode.el) {
                    const placeholder = (instance.subTree = createVNode(Comment));
                    processCommentNode(null, placeholder, container, anchor);
                }
                return;
            }
            setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized);
            {
                popWarningContext();
                endMeasure(instance, `mount`);
            }
        };
        const updateComponent = (n1, n2, optimized) => {
            const instance = (n2.component = n1.component);
            if (shouldUpdateComponent(n1, n2, optimized)) {
                if (instance.asyncDep &&
                    !instance.asyncResolved) {
                    // async & still pending - just update props and slots
                    // since the component's reactive effect for render isn't set-up yet
                    {
                        pushWarningContext(n2);
                    }
                    updateComponentPreRender(instance, n2, optimized);
                    {
                        popWarningContext();
                    }
                    return;
                }
                else {
                    // normal update
                    instance.next = n2;
                    // in case the child component is also queued, remove it to avoid
                    // double updating the same child component in the same flush.
                    invalidateJob(instance.update);
                    // instance.update is the reactive effect runner.
                    instance.update();
                }
            }
            else {
                // no update needed. just copy over properties
                n2.component = n1.component;
                n2.el = n1.el;
                instance.vnode = n2;
            }
        };
        const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized) => {
            // create reactive effect for rendering
            instance.update = effect(function componentEffect() {
                if (!instance.isMounted) {
                    let vnodeHook;
                    const { el, props } = initialVNode;
                    const { bm, m, parent } = instance;
                    // beforeMount hook
                    if (bm) {
                        invokeArrayFns(bm);
                    }
                    // onVnodeBeforeMount
                    if ((vnodeHook = props && props.onVnodeBeforeMount)) {
                        invokeVNodeHook(vnodeHook, parent, initialVNode);
                    }
                    // render
                    {
                        startMeasure(instance, `render`);
                    }
                    const subTree = (instance.subTree = renderComponentRoot(instance));
                    {
                        endMeasure(instance, `render`);
                    }
                    if (el && hydrateNode) {
                        {
                            startMeasure(instance, `hydrate`);
                        }
                        // vnode has adopted host node - perform hydration instead of mount.
                        hydrateNode(initialVNode.el, subTree, instance, parentSuspense);
                        {
                            endMeasure(instance, `hydrate`);
                        }
                    }
                    else {
                        {
                            startMeasure(instance, `patch`);
                        }
                        patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
                        {
                            endMeasure(instance, `patch`);
                        }
                        initialVNode.el = subTree.el;
                    }
                    // mounted hook
                    if (m) {
                        queuePostRenderEffect(m, parentSuspense);
                    }
                    // onVnodeMounted
                    if ((vnodeHook = props && props.onVnodeMounted)) {
                        const scopedInitialVNode = initialVNode;
                        queuePostRenderEffect(() => {
                            invokeVNodeHook(vnodeHook, parent, scopedInitialVNode);
                        }, parentSuspense);
                    }
                    // activated hook for keep-alive roots.
                    // #1742 activated hook must be accessed after first render
                    // since the hook may be injected by a child keep-alive
                    const { a } = instance;
                    if (a &&
                        initialVNode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
                        queuePostRenderEffect(a, parentSuspense);
                    }
                    instance.isMounted = true;
                    {
                        devtoolsComponentAdded(instance);
                    }
                    // #2458: deference mount-only object parameters to prevent memleaks
                    initialVNode = container = anchor = null;
                }
                else {
                    // updateComponent
                    // This is triggered by mutation of component's own state (next: null)
                    // OR parent calling processComponent (next: VNode)
                    let { next, bu, u, parent, vnode } = instance;
                    let originNext = next;
                    let vnodeHook;
                    {
                        pushWarningContext(next || instance.vnode);
                    }
                    if (next) {
                        next.el = vnode.el;
                        updateComponentPreRender(instance, next, optimized);
                    }
                    else {
                        next = vnode;
                    }
                    // beforeUpdate hook
                    if (bu) {
                        invokeArrayFns(bu);
                    }
                    // onVnodeBeforeUpdate
                    if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
                        invokeVNodeHook(vnodeHook, parent, next, vnode);
                    }
                    // render
                    {
                        startMeasure(instance, `render`);
                    }
                    const nextTree = renderComponentRoot(instance);
                    {
                        endMeasure(instance, `render`);
                    }
                    const prevTree = instance.subTree;
                    instance.subTree = nextTree;
                    {
                        startMeasure(instance, `patch`);
                    }
                    patch(prevTree, nextTree,
                        // parent may have changed if it's in a teleport
                        hostParentNode(prevTree.el),
                        // anchor may have changed if it's in a fragment
                        getNextHostNode(prevTree), instance, parentSuspense, isSVG);
                    {
                        endMeasure(instance, `patch`);
                    }
                    next.el = nextTree.el;
                    if (originNext === null) {
                        // self-triggered update. In case of HOC, update parent component
                        // vnode el. HOC is indicated by parent instance's subTree pointing
                        // to child component's vnode
                        updateHOCHostEl(instance, nextTree.el);
                    }
                    // updated hook
                    if (u) {
                        queuePostRenderEffect(u, parentSuspense);
                    }
                    // onVnodeUpdated
                    if ((vnodeHook = next.props && next.props.onVnodeUpdated)) {
                        queuePostRenderEffect(() => {
                            invokeVNodeHook(vnodeHook, parent, next, vnode);
                        }, parentSuspense);
                    }
                    {
                        devtoolsComponentUpdated(instance);
                    }
                    {
                        popWarningContext();
                    }
                }
            }, createDevEffectOptions(instance));
        };
        const updateComponentPreRender = (instance, nextVNode, optimized) => {
            nextVNode.component = instance;
            const prevProps = instance.vnode.props;
            instance.vnode = nextVNode;
            instance.next = null;
            updateProps(instance, nextVNode.props, prevProps, optimized);
            updateSlots(instance, nextVNode.children);
            // props update may have triggered pre-flush watchers.
            // flush them before the render update.
            flushPreFlushCbs(undefined, instance.update);
        };
        const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized = false) => {
            const c1 = n1 && n1.children;
            const prevShapeFlag = n1 ? n1.shapeFlag : 0;
            const c2 = n2.children;
            const { patchFlag, shapeFlag } = n2;
            // fast path
            if (patchFlag > 0) {
                if (patchFlag & 128 /* KEYED_FRAGMENT */) {
                    // this could be either fully-keyed or mixed (some keyed some not)
                    // presence of patchFlag means children are guaranteed to be arrays
                    patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    return;
                }
                else if (patchFlag & 256 /* UNKEYED_FRAGMENT */) {
                    // unkeyed
                    patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    return;
                }
            }
            // children has 3 possibilities: text, array or no children.
            if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                // text children fast path
                if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                    unmountChildren(c1, parentComponent, parentSuspense);
                }
                if (c2 !== c1) {
                    hostSetElementText(container, c2);
                }
            }
            else {
                if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                    // prev children was array
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        // two arrays, cannot assume anything, do full diff
                        patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                    else {
                        // no new children, just unmount old
                        unmountChildren(c1, parentComponent, parentSuspense, true);
                    }
                }
                else {
                    // prev children was text OR null
                    // new children is array OR null
                    if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
                        hostSetElementText(container, '');
                    }
                    // mount new if array
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                }
            }
        };
        const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            c1 = c1 || EMPTY_ARR;
            c2 = c2 || EMPTY_ARR;
            const oldLength = c1.length;
            const newLength = c2.length;
            const commonLength = Math.min(oldLength, newLength);
            let i;
            for (i = 0; i < commonLength; i++) {
                const nextChild = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, isSVG, optimized);
            }
            if (oldLength > newLength) {
                // remove old
                unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
            }
            else {
                // mount new
                mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, commonLength);
            }
        };
        // can be all-keyed or mixed
        const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, optimized) => {
            let i = 0;
            const l2 = c2.length;
            let e1 = c1.length - 1; // prev ending index
            let e2 = l2 - 1; // next ending index
            // 1. sync from start
            // (a b) c
            // (a b) d e
            while (i <= e1 && i <= e2) {
                const n1 = c1[i];
                const n2 = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                if (isSameVNodeType(n1, n2)) {
                    patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized);
                }
                else {
                    break;
                }
                i++;
            }
            // 2. sync from end
            // a (b c)
            // d e (b c)
            while (i <= e1 && i <= e2) {
                const n1 = c1[e1];
                const n2 = (c2[e2] = optimized
                    ? cloneIfMounted(c2[e2])
                    : normalizeVNode(c2[e2]));
                if (isSameVNodeType(n1, n2)) {
                    patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, optimized);
                }
                else {
                    break;
                }
                e1--;
                e2--;
            }
            // 3. common sequence + mount
            // (a b)
            // (a b) c
            // i = 2, e1 = 1, e2 = 2
            // (a b)
            // c (a b)
            // i = 0, e1 = -1, e2 = 0
            if (i > e1) {
                if (i <= e2) {
                    const nextPos = e2 + 1;
                    const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
                    while (i <= e2) {
                        patch(null, (c2[i] = optimized
                            ? cloneIfMounted(c2[i])
                            : normalizeVNode(c2[i])), container, anchor, parentComponent, parentSuspense, isSVG);
                        i++;
                    }
                }
            }
            // 4. common sequence + unmount
            // (a b) c
            // (a b)
            // i = 2, e1 = 2, e2 = 1
            // a (b c)
            // (b c)
            // i = 0, e1 = 0, e2 = -1
            else if (i > e2) {
                while (i <= e1) {
                    unmount(c1[i], parentComponent, parentSuspense, true);
                    i++;
                }
            }
            // 5. unknown sequence
            // [i ... e1 + 1]: a b [c d e] f g
            // [i ... e2 + 1]: a b [e d c h] f g
            // i = 2, e1 = 4, e2 = 5
            else {
                const s1 = i; // prev starting index
                const s2 = i; // next starting index
                // 5.1 build key:index map for newChildren
                const keyToNewIndexMap = new Map();
                for (i = s2; i <= e2; i++) {
                    const nextChild = (c2[i] = optimized
                        ? cloneIfMounted(c2[i])
                        : normalizeVNode(c2[i]));
                    if (nextChild.key != null) {
                        if (keyToNewIndexMap.has(nextChild.key)) {
                            warn(`Duplicate keys found during update:`, JSON.stringify(nextChild.key), `Make sure keys are unique.`);
                        }
                        keyToNewIndexMap.set(nextChild.key, i);
                    }
                }
                // 5.2 loop through old children left to be patched and try to patch
                // matching nodes & remove nodes that are no longer present
                let j;
                let patched = 0;
                const toBePatched = e2 - s2 + 1;
                let moved = false;
                // used to track whether any node has moved
                let maxNewIndexSoFar = 0;
                // works as Map<newIndex, oldIndex>
                // Note that oldIndex is offset by +1
                // and oldIndex = 0 is a special value indicating the new node has
                // no corresponding old node.
                // used for determining longest stable subsequence
                const newIndexToOldIndexMap = new Array(toBePatched);
                for (i = 0; i < toBePatched; i++)
                    newIndexToOldIndexMap[i] = 0;
                for (i = s1; i <= e1; i++) {
                    const prevChild = c1[i];
                    if (patched >= toBePatched) {
                        // all new children have been patched so this can only be a removal
                        unmount(prevChild, parentComponent, parentSuspense, true);
                        continue;
                    }
                    let newIndex;
                    if (prevChild.key != null) {
                        newIndex = keyToNewIndexMap.get(prevChild.key);
                    }
                    else {
                        // key-less node, try to locate a key-less node of the same type
                        for (j = s2; j <= e2; j++) {
                            if (newIndexToOldIndexMap[j - s2] === 0 &&
                                isSameVNodeType(prevChild, c2[j])) {
                                newIndex = j;
                                break;
                            }
                        }
                    }
                    if (newIndex === undefined) {
                        unmount(prevChild, parentComponent, parentSuspense, true);
                    }
                    else {
                        newIndexToOldIndexMap[newIndex - s2] = i + 1;
                        if (newIndex >= maxNewIndexSoFar) {
                            maxNewIndexSoFar = newIndex;
                        }
                        else {
                            moved = true;
                        }
                        patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, optimized);
                        patched++;
                    }
                }
                // 5.3 move and mount
                // generate longest stable subsequence only when nodes have moved
                const increasingNewIndexSequence = moved
                    ? getSequence(newIndexToOldIndexMap)
                    : EMPTY_ARR;
                j = increasingNewIndexSequence.length - 1;
                // looping backwards so that we can use last patched node as anchor
                for (i = toBePatched - 1; i >= 0; i--) {
                    const nextIndex = s2 + i;
                    const nextChild = c2[nextIndex];
                    const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
                    if (newIndexToOldIndexMap[i] === 0) {
                        // mount new
                        patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG);
                    }
                    else if (moved) {
                        // move if:
                        // There is no stable subsequence (e.g. a reverse)
                        // OR current node is not among the stable sequence
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                            move(nextChild, container, anchor, 2 /* REORDER */);
                        }
                        else {
                            j--;
                        }
                    }
                }
            }
        };
        const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
            const { el, type, transition, children, shapeFlag } = vnode;
            if (shapeFlag & 6 /* COMPONENT */) {
                move(vnode.component.subTree, container, anchor, moveType);
                return;
            }
            if (shapeFlag & 128 /* SUSPENSE */) {
                vnode.suspense.move(container, anchor, moveType);
                return;
            }
            if (shapeFlag & 64 /* TELEPORT */) {
                type.move(vnode, container, anchor, internals);
                return;
            }
            if (type === Fragment) {
                hostInsert(el, container, anchor);
                for (let i = 0; i < children.length; i++) {
                    move(children[i], container, anchor, moveType);
                }
                hostInsert(vnode.anchor, container, anchor);
                return;
            }
            if (type === Static) {
                moveStaticNode(vnode, container, anchor);
                return;
            }
            // single nodes
            const needTransition = moveType !== 2 /* REORDER */ &&
                shapeFlag & 1 /* ELEMENT */ &&
                transition;
            if (needTransition) {
                if (moveType === 0 /* ENTER */) {
                    transition.beforeEnter(el);
                    hostInsert(el, container, anchor);
                    queuePostRenderEffect(() => transition.enter(el), parentSuspense);
                }
                else {
                    const { leave, delayLeave, afterLeave } = transition;
                    const remove = () => hostInsert(el, container, anchor);
                    const performLeave = () => {
                        leave(el, () => {
                            remove();
                            afterLeave && afterLeave();
                        });
                    };
                    if (delayLeave) {
                        delayLeave(el, remove, performLeave);
                    }
                    else {
                        performLeave();
                    }
                }
            }
            else {
                hostInsert(el, container, anchor);
            }
        };
        const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
            const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs } = vnode;
            // unset ref
            if (ref != null) {
                setRef(ref, null, parentSuspense, null);
            }
            if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
                parentComponent.ctx.deactivate(vnode);
                return;
            }
            const shouldInvokeDirs = shapeFlag & 1 /* ELEMENT */ && dirs;
            let vnodeHook;
            if ((vnodeHook = props && props.onVnodeBeforeUnmount)) {
                invokeVNodeHook(vnodeHook, parentComponent, vnode);
            }
            if (shapeFlag & 6 /* COMPONENT */) {
                unmountComponent(vnode.component, parentSuspense, doRemove);
            }
            else {
                if (shapeFlag & 128 /* SUSPENSE */) {
                    vnode.suspense.unmount(parentSuspense, doRemove);
                    return;
                }
                if (shouldInvokeDirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'beforeUnmount');
                }
                if (dynamicChildren &&
                    // #1153: fast path should not be taken for non-stable (v-for) fragments
                    (type !== Fragment ||
                        (patchFlag > 0 && patchFlag & 64 /* STABLE_FRAGMENT */))) {
                    // fast path for block nodes: only need to unmount dynamic children.
                    unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
                }
                else if ((type === Fragment &&
                    (patchFlag & 128 /* KEYED_FRAGMENT */ ||
                        patchFlag & 256 /* UNKEYED_FRAGMENT */)) ||
                    (!optimized && shapeFlag & 16 /* ARRAY_CHILDREN */)) {
                    unmountChildren(children, parentComponent, parentSuspense);
                }
                // an unmounted teleport should always remove its children if not disabled
                if (shapeFlag & 64 /* TELEPORT */ &&
                    (doRemove || !isTeleportDisabled(vnode.props))) {
                    vnode.type.remove(vnode, internals);
                }
                if (doRemove) {
                    remove(vnode);
                }
            }
            if ((vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    shouldInvokeDirs &&
                        invokeDirectiveHook(vnode, null, parentComponent, 'unmounted');
                }, parentSuspense);
            }
        };
        const remove = vnode => {
            const { type, el, anchor, transition } = vnode;
            if (type === Fragment) {
                removeFragment(el, anchor);
                return;
            }
            if (type === Static) {
                removeStaticNode(vnode);
                return;
            }
            const performRemove = () => {
                hostRemove(el);
                if (transition && !transition.persisted && transition.afterLeave) {
                    transition.afterLeave();
                }
            };
            if (vnode.shapeFlag & 1 /* ELEMENT */ &&
                transition &&
                !transition.persisted) {
                const { leave, delayLeave } = transition;
                const performLeave = () => leave(el, performRemove);
                if (delayLeave) {
                    delayLeave(vnode.el, performRemove, performLeave);
                }
                else {
                    performLeave();
                }
            }
            else {
                performRemove();
            }
        };
        const removeFragment = (cur, end) => {
            // For fragments, directly remove all contained DOM nodes.
            // (fragment child nodes cannot have transition)
            let next;
            while (cur !== end) {
                next = hostNextSibling(cur);
                hostRemove(cur);
                cur = next;
            }
            hostRemove(end);
        };
        const unmountComponent = (instance, parentSuspense, doRemove) => {
            if (instance.type.__hmrId) {
                unregisterHMR(instance);
            }
            const { bum, effects, update, subTree, um } = instance;
            // beforeUnmount hook
            if (bum) {
                invokeArrayFns(bum);
            }
            if (effects) {
                for (let i = 0; i < effects.length; i++) {
                    stop(effects[i]);
                }
            }
            // update may be null if a component is unmounted before its async
            // setup has resolved.
            if (update) {
                stop(update);
                unmount(subTree, instance, parentSuspense, doRemove);
            }
            // unmounted hook
            if (um) {
                queuePostRenderEffect(um, parentSuspense);
            }
            queuePostRenderEffect(() => {
                instance.isUnmounted = true;
            }, parentSuspense);
            // A component with async dep inside a pending suspense is unmounted before
            // its async dep resolves. This should remove the dep from the suspense, and
            // cause the suspense to resolve immediately if that was the last dep.
            if (parentSuspense &&
                parentSuspense.pendingBranch &&
                !parentSuspense.isUnmounted &&
                instance.asyncDep &&
                !instance.asyncResolved &&
                instance.suspenseId === parentSuspense.pendingId) {
                parentSuspense.deps--;
                if (parentSuspense.deps === 0) {
                    parentSuspense.resolve();
                }
            }
            {
                devtoolsComponentRemoved(instance);
            }
        };
        const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
            for (let i = start; i < children.length; i++) {
                unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
            }
        };
        const getNextHostNode = vnode => {
            if (vnode.shapeFlag & 6 /* COMPONENT */) {
                return getNextHostNode(vnode.component.subTree);
            }
            if (vnode.shapeFlag & 128 /* SUSPENSE */) {
                return vnode.suspense.next();
            }
            return hostNextSibling((vnode.anchor || vnode.el));
        };
        const render = (vnode, container) => {
            if (vnode == null) {
                if (container._vnode) {
                    unmount(container._vnode, null, null, true);
                }
            }
            else {
                patch(container._vnode || null, vnode, container);
            }
            flushPostFlushCbs();
            container._vnode = vnode;
        };
        const internals = {
            p: patch,
            um: unmount,
            m: move,
            r: remove,
            mt: mountComponent,
            mc: mountChildren,
            pc: patchChildren,
            pbc: patchBlockChildren,
            n: getNextHostNode,
            o: options
        };
        let hydrate;
        let hydrateNode;
        if (createHydrationFns) {
            [hydrate, hydrateNode] = createHydrationFns(internals);
        }
        return {
            render,
            hydrate,
            createApp: createAppAPI(render, hydrate)
        };
    }
    function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
        callWithAsyncErrorHandling(hook, instance, 7 /* VNODE_HOOK */, [
            vnode,
            prevVNode
        ]);
    }
    /**
     * #1156
     * When a component is HMR-enabled, we need to make sure that all static nodes
     * inside a block also inherit the DOM element from the previous tree so that
     * HMR updates (which are full updates) can retrieve the element for patching.
     *
     * #2080
     * Inside keyed `template` fragment static children, if a fragment is moved,
     * the children will always moved so that need inherit el form previous nodes
     * to ensure correct moved position.
     */
    function traverseStaticChildren(n1, n2, shallow = false) {
        const ch1 = n1.children;
        const ch2 = n2.children;
        if (isArray(ch1) && isArray(ch2)) {
            for (let i = 0; i < ch1.length; i++) {
                // this is only called in the optimized path so array children are
                // guaranteed to be vnodes
                const c1 = ch1[i];
                let c2 = ch2[i];
                if (c2.shapeFlag & 1 /* ELEMENT */ && !c2.dynamicChildren) {
                    if (c2.patchFlag <= 0 || c2.patchFlag === 32 /* HYDRATE_EVENTS */) {
                        c2 = ch2[i] = cloneIfMounted(ch2[i]);
                        c2.el = c1.el;
                    }
                    if (!shallow)
                        traverseStaticChildren(c1, c2);
                }
                // also inherit for comment nodes, but not placeholders (e.g. v-if which
                // would have received .el during block patch)
                if (c2.type === Comment && !c2.el) {
                    c2.el = c1.el;
                }
            }
        }
    }
    // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
    function getSequence(arr) {
        const p = arr.slice();
        const result = [0];
        let i, j, u, v, c;
        const len = arr.length;
        for (i = 0; i < len; i++) {
            const arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = ((u + v) / 2) | 0;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }

    const isTeleport = (type) => type.__isTeleport;
    const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === '');
    const isTargetSVG = (target) => typeof SVGElement !== 'undefined' && target instanceof SVGElement;
    const resolveTarget = (props, select) => {
        const targetSelector = props && props.to;
        if (isString(targetSelector)) {
            if (!select) {
                warn(`Current renderer does not support string target for Teleports. ` +
                    `(missing querySelector renderer option)`);
                return null;
            }
            else {
                const target = select(targetSelector);
                if (!target) {
                    warn(`Failed to locate Teleport target with selector "${targetSelector}". ` +
                        `Note the target element must exist before the component is mounted - ` +
                        `i.e. the target cannot be rendered by the component itself, and ` +
                        `ideally should be outside of the entire Vue component tree.`);
                }
                return target;
            }
        }
        else {
            if (!targetSelector && !isTeleportDisabled(props)) {
                warn(`Invalid Teleport target: ${targetSelector}`);
            }
            return targetSelector;
        }
    };
    const TeleportImpl = {
        __isTeleport: true,
        process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized, internals) {
            const { mc: mountChildren, pc: patchChildren, pbc: patchBlockChildren, o: { insert, querySelector, createText, createComment } } = internals;
            const disabled = isTeleportDisabled(n2.props);
            const { shapeFlag, children } = n2;
            if (n1 == null) {
                // insert anchors in the main view
                const placeholder = (n2.el = createComment('teleport start')
                );
                const mainAnchor = (n2.anchor = createComment('teleport end')
                );
                insert(placeholder, container, anchor);
                insert(mainAnchor, container, anchor);
                const target = (n2.target = resolveTarget(n2.props, querySelector));
                const targetAnchor = (n2.targetAnchor = createText(''));
                if (target) {
                    insert(targetAnchor, target);
                    // #2652 we could be teleporting from a non-SVG tree into an SVG tree
                    isSVG = isSVG || isTargetSVG(target);
                }
                else if (!disabled) {
                    warn('Invalid Teleport target on mount:', target, `(${typeof target})`);
                }
                const mount = (container, anchor) => {
                    // Teleport *always* has Array children. This is enforced in both the
                    // compiler and vnode children normalization.
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        mountChildren(children, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                    }
                };
                if (disabled) {
                    mount(container, mainAnchor);
                }
                else if (target) {
                    mount(target, targetAnchor);
                }
            }
            else {
                // update content
                n2.el = n1.el;
                const mainAnchor = (n2.anchor = n1.anchor);
                const target = (n2.target = n1.target);
                const targetAnchor = (n2.targetAnchor = n1.targetAnchor);
                const wasDisabled = isTeleportDisabled(n1.props);
                const currentContainer = wasDisabled ? container : target;
                const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
                isSVG = isSVG || isTargetSVG(target);
                if (n2.dynamicChildren) {
                    // fast path when the teleport happens to be a block root
                    patchBlockChildren(n1.dynamicChildren, n2.dynamicChildren, currentContainer, parentComponent, parentSuspense, isSVG);
                    // even in block tree mode we need to make sure all root-level nodes
                    // in the teleport inherit previous DOM references so that they can
                    // be moved in future patches.
                    traverseStaticChildren(n1, n2, true);
                }
                else if (!optimized) {
                    patchChildren(n1, n2, currentContainer, currentAnchor, parentComponent, parentSuspense, isSVG);
                }
                if (disabled) {
                    if (!wasDisabled) {
                        // enabled -> disabled
                        // move into main container
                        moveTeleport(n2, container, mainAnchor, internals, 1 /* TOGGLE */);
                    }
                }
                else {
                    // target changed
                    if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
                        const nextTarget = (n2.target = resolveTarget(n2.props, querySelector));
                        if (nextTarget) {
                            moveTeleport(n2, nextTarget, null, internals, 0 /* TARGET_CHANGE */);
                        }
                        else {
                            warn('Invalid Teleport target on update:', target, `(${typeof target})`);
                        }
                    }
                    else if (wasDisabled) {
                        // disabled -> enabled
                        // move into teleport target
                        moveTeleport(n2, target, targetAnchor, internals, 1 /* TOGGLE */);
                    }
                }
            }
        },
        remove(vnode, { r: remove, o: { remove: hostRemove } }) {
            const { shapeFlag, children, anchor } = vnode;
            hostRemove(anchor);
            if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                for (let i = 0; i < children.length; i++) {
                    remove(children[i]);
                }
            }
        },
        move: moveTeleport,
        hydrate: hydrateTeleport
    };
    function moveTeleport(vnode, container, parentAnchor, { o: { insert }, m: move }, moveType = 2 /* REORDER */) {
        // move target anchor if this is a target change.
        if (moveType === 0 /* TARGET_CHANGE */) {
            insert(vnode.targetAnchor, container, parentAnchor);
        }
        const { el, anchor, shapeFlag, children, props } = vnode;
        const isReorder = moveType === 2 /* REORDER */;
        // move main view anchor if this is a re-order.
        if (isReorder) {
            insert(el, container, parentAnchor);
        }
        // if this is a re-order and teleport is enabled (content is in target)
        // do not move children. So the opposite is: only move children if this
        // is not a reorder, or the teleport is disabled
        if (!isReorder || isTeleportDisabled(props)) {
            // Teleport has either Array children or no children.
            if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                for (let i = 0; i < children.length; i++) {
                    move(children[i], container, parentAnchor, 2 /* REORDER */);
                }
            }
        }
        // move main view anchor if this is a re-order.
        if (isReorder) {
            insert(anchor, container, parentAnchor);
        }
    }
    function hydrateTeleport(node, vnode, parentComponent, parentSuspense, optimized, { o: { nextSibling, parentNode, querySelector } }, hydrateChildren) {
        const target = (vnode.target = resolveTarget(vnode.props, querySelector));
        if (target) {
            // if multiple teleports rendered to the same target element, we need to
            // pick up from where the last teleport finished instead of the first node
            const targetNode = target._lpa || target.firstChild;
            if (vnode.shapeFlag & 16 /* ARRAY_CHILDREN */) {
                if (isTeleportDisabled(vnode.props)) {
                    vnode.anchor = hydrateChildren(nextSibling(node), vnode, parentNode(node), parentComponent, parentSuspense, optimized);
                    vnode.targetAnchor = targetNode;
                }
                else {
                    vnode.anchor = nextSibling(node);
                    vnode.targetAnchor = hydrateChildren(targetNode, vnode, target, parentComponent, parentSuspense, optimized);
                }
                target._lpa =
                    vnode.targetAnchor && nextSibling(vnode.targetAnchor);
            }
        }
        return vnode.anchor && nextSibling(vnode.anchor);
    }
    // Force-casted public typing for h and TSX props inference
    const Teleport = TeleportImpl;

    const COMPONENTS = 'components';
    const DIRECTIVES = 'directives';
    /**
     * @private
     */
    function resolveComponent(name) {
        return resolveAsset(COMPONENTS, name) || name;
    }
    const NULL_DYNAMIC_COMPONENT = Symbol();
    /**
     * @private
     */
    function resolveDynamicComponent(component) {
        if (isString(component)) {
            return resolveAsset(COMPONENTS, component, false) || component;
        }
        else {
            // invalid types will fallthrough to createVNode and raise warning
            return (component || NULL_DYNAMIC_COMPONENT);
        }
    }
    /**
     * @private
     */
    function resolveDirective(name) {
        return resolveAsset(DIRECTIVES, name);
    }
    // implementation
    function resolveAsset(type, name, warnMissing = true) {
        const instance = currentRenderingInstance || currentInstance;
        if (instance) {
            const Component = instance.type;
            // self name has highest priority
            if (type === COMPONENTS) {
                // special self referencing call generated by compiler
                // inferred from SFC filename
                if (name === `_self`) {
                    return Component;
                }
                const selfName = getComponentName(Component);
                if (selfName &&
                    (selfName === name ||
                        selfName === camelize(name) ||
                        selfName === capitalize(camelize(name)))) {
                    return Component;
                }
            }
            const res =
                // local registration
                // check instance[type] first for components with mixin or extends.
                resolve(instance[type] || Component[type], name) ||
                // global registration
                resolve(instance.appContext[type], name);
            if (warnMissing && !res) {
                warn(`Failed to resolve ${type.slice(0, -1)}: ${name}`);
            }
            return res;
        }
        else {
            warn(`resolve${capitalize(type.slice(0, -1))} ` +
                `can only be used in render() or setup().`);
        }
    }
    function resolve(registry, name) {
        return (registry &&
            (registry[name] ||
                registry[camelize(name)] ||
                registry[capitalize(camelize(name))]));
    }

    const Fragment = Symbol('Fragment');
    const Text = Symbol('Text');
    const Comment = Symbol('Comment');
    const Static = Symbol('Static');
    // Since v-if and v-for are the two possible ways node structure can dynamically
    // change, once we consider v-if branches and each v-for fragment a block, we
    // can divide a template into nested blocks, and within each block the node
    // structure would be stable. This allows us to skip most children diffing
    // and only worry about the dynamic nodes (indicated by patch flags).
    const blockStack = [];
    let currentBlock = null;
    /**
     * Open a block.
     * This must be called before `createBlock`. It cannot be part of `createBlock`
     * because the children of the block are evaluated before `createBlock` itself
     * is called. The generated code typically looks like this:
     *
     * ```js
     * function render() {
     *   return (openBlock(),createBlock('div', null, [...]))
     * }
     * ```
     * disableTracking is true when creating a v-for fragment block, since a v-for
     * fragment always diffs its children.
     *
     * @private
     */
    function openBlock(disableTracking = false) {
        blockStack.push((currentBlock = disableTracking ? null : []));
    }
    function closeBlock() {
        blockStack.pop();
        currentBlock = blockStack[blockStack.length - 1] || null;
    }
    // Whether we should be tracking dynamic child nodes inside a block.
    // Only tracks when this value is > 0
    // We are not using a simple boolean because this value may need to be
    // incremented/decremented by nested usage of v-once (see below)
    let shouldTrack$1 = 1;
    /**
     * Block tracking sometimes needs to be disabled, for example during the
     * creation of a tree that needs to be cached by v-once. The compiler generates
     * code like this:
     *
     * ``` js
     * _cache[1] || (
     *   setBlockTracking(-1),
     *   _cache[1] = createVNode(...),
     *   setBlockTracking(1),
     *   _cache[1]
     * )
     * ```
     *
     * @private
     */
    function setBlockTracking(value) {
        shouldTrack$1 += value;
    }
    /**
     * Create a block root vnode. Takes the same exact arguments as `createVNode`.
     * A block root keeps track of dynamic nodes within the block in the
     * `dynamicChildren` array.
     *
     * @private
     */
    function createBlock(type, props, children, patchFlag, dynamicProps) {
        const vnode = createVNode(type, props, children, patchFlag, dynamicProps, true /* isBlock: prevent a block from tracking itself */);
        // save current block children on the block vnode
        vnode.dynamicChildren = currentBlock || EMPTY_ARR;
        // close block
        closeBlock();
        // a block is always going to be patched, so track it as a child of its
        // parent block
        if (shouldTrack$1 > 0 && currentBlock) {
            currentBlock.push(vnode);
        }
        return vnode;
    }
    function isVNode(value) {
        return value ? value.__v_isVNode === true : false;
    }
    function isSameVNodeType(n1, n2) {
        if (n2.shapeFlag & 6 /* COMPONENT */ &&
            hmrDirtyComponents.has(n2.type)) {
            // HMR only: if the component has been hot-updated, force a reload.
            return false;
        }
        return n1.type === n2.type && n1.key === n2.key;
    }
    let vnodeArgsTransformer;
    /**
     * Internal API for registering an arguments transform for createVNode
     * used for creating stubs in the test-utils
     * It is *internal* but needs to be exposed for test-utils to pick up proper
     * typings
     */
    function transformVNodeArgs(transformer) {
        vnodeArgsTransformer = transformer;
    }
    const createVNodeWithArgsTransform = (...args) => {
        return _createVNode(...(vnodeArgsTransformer
            ? vnodeArgsTransformer(args, currentRenderingInstance)
            : args));
    };
    const InternalObjectKey = `__vInternal`;
    const normalizeKey = ({ key }) => key != null ? key : null;
    const normalizeRef = ({ ref }) => {
        return (ref != null
            ? isString(ref) || isRef(ref) || isFunction(ref)
                ? { i: currentRenderingInstance, r: ref }
                : ref
            : null);
    };
    const createVNode = (createVNodeWithArgsTransform
    );
    function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        if (!type || type === NULL_DYNAMIC_COMPONENT) {
            if (!type) {
                warn(`Invalid vnode type when creating vnode: ${type}.`);
            }
            type = Comment;
        }
        if (isVNode(type)) {
            // createVNode receiving an existing vnode. This happens in cases like
            // <component :is="vnode"/>
            // #2078 make sure to merge refs during the clone instead of overwriting it
            const cloned = cloneVNode(type, props, true /* mergeRef: true */);
            if (children) {
                normalizeChildren(cloned, children);
            }
            return cloned;
        }
        // class component normalization.
        if (isClassComponent(type)) {
            type = type.__vccOpts;
        }
        // class & style normalization.
        if (props) {
            // for reactive or proxy objects, we need to clone it to enable mutation.
            if (isProxy(props) || InternalObjectKey in props) {
                props = extend({}, props);
            }
            let { class: klass, style } = props;
            if (klass && !isString(klass)) {
                props.class = normalizeClass(klass);
            }
            if (isObject(style)) {
                // reactive state objects need to be cloned since they are likely to be
                // mutated
                if (isProxy(style) && !isArray(style)) {
                    style = extend({}, style);
                }
                props.style = normalizeStyle(style);
            }
        }
        // encode the vnode type information into a bitmap
        const shapeFlag = isString(type)
            ? 1 /* ELEMENT */
            : isSuspense(type)
                ? 128 /* SUSPENSE */
                : isTeleport(type)
                    ? 64 /* TELEPORT */
                    : isObject(type)
                        ? 4 /* STATEFUL_COMPONENT */
                        : isFunction(type)
                            ? 2 /* FUNCTIONAL_COMPONENT */
                            : 0;
        if (shapeFlag & 4 /* STATEFUL_COMPONENT */ && isProxy(type)) {
            type = toRaw(type);
            warn(`Vue received a Component which was made a reactive object. This can ` +
                `lead to unnecessary performance overhead, and should be avoided by ` +
                `marking the component with \`markRaw\` or using \`shallowRef\` ` +
                `instead of \`ref\`.`, `\nComponent that was made reactive: `, type);
        }
        const vnode = {
            __v_isVNode: true,
            ["__v_skip" /* SKIP */]: true,
            type,
            props,
            key: props && normalizeKey(props),
            ref: props && normalizeRef(props),
            scopeId: currentScopeId,
            children: null,
            component: null,
            suspense: null,
            ssContent: null,
            ssFallback: null,
            dirs: null,
            transition: null,
            el: null,
            anchor: null,
            target: null,
            targetAnchor: null,
            staticCount: 0,
            shapeFlag,
            patchFlag,
            dynamicProps,
            dynamicChildren: null,
            appContext: null
        };
        // validate key
        if (vnode.key !== vnode.key) {
            warn(`VNode created with invalid key (NaN). VNode type:`, vnode.type);
        }
        normalizeChildren(vnode, children);
        // normalize suspense children
        if (shapeFlag & 128 /* SUSPENSE */) {
            const { content, fallback } = normalizeSuspenseChildren(vnode);
            vnode.ssContent = content;
            vnode.ssFallback = fallback;
        }
        if (shouldTrack$1 > 0 &&
            // avoid a block node from tracking itself
            !isBlockNode &&
            // has current parent block
            currentBlock &&
            // presence of a patch flag indicates this node needs patching on updates.
            // component nodes also should always be patched, because even if the
            // component doesn't need to update, it needs to persist the instance on to
            // the next vnode so that it can be properly unmounted later.
            (patchFlag > 0 || shapeFlag & 6 /* COMPONENT */) &&
            // the EVENTS flag is only for hydration and if it is the only flag, the
            // vnode should not be considered dynamic due to handler caching.
            patchFlag !== 32 /* HYDRATE_EVENTS */) {
            currentBlock.push(vnode);
        }
        return vnode;
    }
    function cloneVNode(vnode, extraProps, mergeRef = false) {
        // This is intentionally NOT using spread or extend to avoid the runtime
        // key enumeration cost.
        const { props, ref, patchFlag, children } = vnode;
        const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
        return {
            __v_isVNode: true,
            ["__v_skip" /* SKIP */]: true,
            type: vnode.type,
            props: mergedProps,
            key: mergedProps && normalizeKey(mergedProps),
            ref: extraProps && extraProps.ref
                ? // #2078 in the case of <component :is="vnode" ref="extra"/>
                // if the vnode itself already has a ref, cloneVNode will need to merge
                // the refs so the single vnode can be set on multiple refs
                mergeRef && ref
                    ? isArray(ref)
                        ? ref.concat(normalizeRef(extraProps))
                        : [ref, normalizeRef(extraProps)]
                    : normalizeRef(extraProps)
                : ref,
            scopeId: vnode.scopeId,
            children: patchFlag === -1 /* HOISTED */ && isArray(children)
                ? children.map(deepCloneVNode)
                : children,
            target: vnode.target,
            targetAnchor: vnode.targetAnchor,
            staticCount: vnode.staticCount,
            shapeFlag: vnode.shapeFlag,
            // if the vnode is cloned with extra props, we can no longer assume its
            // existing patch flag to be reliable and need to add the FULL_PROPS flag.
            // note: perserve flag for fragments since they use the flag for children
            // fast paths only.
            patchFlag: extraProps && vnode.type !== Fragment
                ? patchFlag === -1 // hoisted node
                    ? 16 /* FULL_PROPS */
                    : patchFlag | 16 /* FULL_PROPS */
                : patchFlag,
            dynamicProps: vnode.dynamicProps,
            dynamicChildren: vnode.dynamicChildren,
            appContext: vnode.appContext,
            dirs: vnode.dirs,
            transition: vnode.transition,
            // These should technically only be non-null on mounted VNodes. However,
            // they *should* be copied for kept-alive vnodes. So we just always copy
            // them since them being non-null during a mount doesn't affect the logic as
            // they will simply be overwritten.
            component: vnode.component,
            suspense: vnode.suspense,
            ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
            ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
            el: vnode.el,
            anchor: vnode.anchor
        };
    }
    /**
     * Dev only, for HMR of hoisted vnodes reused in v-for
     * https://github.com/vitejs/vite/issues/2022
     */
    function deepCloneVNode(vnode) {
        const cloned = cloneVNode(vnode);
        if (isArray(vnode.children)) {
            cloned.children = vnode.children.map(deepCloneVNode);
        }
        return cloned;
    }
    /**
     * @private
     */
    function createTextVNode(text = ' ', flag = 0) {
        return createVNode(Text, null, text, flag);
    }
    /**
     * @private
     */
    function createStaticVNode(content, numberOfNodes) {
        // A static vnode can contain multiple stringified elements, and the number
        // of elements is necessary for hydration.
        const vnode = createVNode(Static, null, content);
        vnode.staticCount = numberOfNodes;
        return vnode;
    }
    /**
     * @private
     */
    function createCommentVNode(text = '',
        // when used as the v-else branch, the comment node must be created as a
        // block to ensure correct updates.
        asBlock = false) {
        return asBlock
            ? (openBlock(), createBlock(Comment, null, text))
            : createVNode(Comment, null, text);
    }
    function normalizeVNode(child) {
        if (child == null || typeof child === 'boolean') {
            // empty placeholder
            return createVNode(Comment);
        }
        else if (isArray(child)) {
            // fragment
            return createVNode(Fragment, null, child);
        }
        else if (typeof child === 'object') {
            // already vnode, this should be the most common since compiled templates
            // always produce all-vnode children arrays
            return child.el === null ? child : cloneVNode(child);
        }
        else {
            // strings and numbers
            return createVNode(Text, null, String(child));
        }
    }
    // optimized normalization for template-compiled render fns
    function cloneIfMounted(child) {
        return child.el === null ? child : cloneVNode(child);
    }
    function normalizeChildren(vnode, children) {
        let type = 0;
        const { shapeFlag } = vnode;
        if (children == null) {
            children = null;
        }
        else if (isArray(children)) {
            type = 16 /* ARRAY_CHILDREN */;
        }
        else if (typeof children === 'object') {
            if (shapeFlag & 1 /* ELEMENT */ || shapeFlag & 64 /* TELEPORT */) {
                // Normalize slot to plain children for plain element and Teleport
                const slot = children.default;
                if (slot) {
                    // _c marker is added by withCtx() indicating this is a compiled slot
                    slot._c && setCompiledSlotRendering(1);
                    normalizeChildren(vnode, slot());
                    slot._c && setCompiledSlotRendering(-1);
                }
                return;
            }
            else {
                type = 32 /* SLOTS_CHILDREN */;
                const slotFlag = children._;
                if (!slotFlag && !(InternalObjectKey in children)) {
                    children._ctx = currentRenderingInstance;
                }
                else if (slotFlag === 3 /* FORWARDED */ && currentRenderingInstance) {
                    // a child component receives forwarded slots from the parent.
                    // its slot type is determined by its parent's slot type.
                    if (currentRenderingInstance.vnode.patchFlag & 1024 /* DYNAMIC_SLOTS */) {
                        children._ = 2 /* DYNAMIC */;
                        vnode.patchFlag |= 1024 /* DYNAMIC_SLOTS */;
                    }
                    else {
                        children._ = 1 /* STABLE */;
                    }
                }
            }
        }
        else if (isFunction(children)) {
            children = { default: children, _ctx: currentRenderingInstance };
            type = 32 /* SLOTS_CHILDREN */;
        }
        else {
            children = String(children);
            // force teleport children to array so it can be moved around
            if (shapeFlag & 64 /* TELEPORT */) {
                type = 16 /* ARRAY_CHILDREN */;
                children = [createTextVNode(children)];
            }
            else {
                type = 8 /* TEXT_CHILDREN */;
            }
        }
        vnode.children = children;
        vnode.shapeFlag |= type;
    }
    function mergeProps(...args) {
        const ret = extend({}, args[0]);
        for (let i = 1; i < args.length; i++) {
            const toMerge = args[i];
            for (const key in toMerge) {
                if (key === 'class') {
                    if (ret.class !== toMerge.class) {
                        ret.class = normalizeClass([ret.class, toMerge.class]);
                    }
                }
                else if (key === 'style') {
                    ret.style = normalizeStyle([ret.style, toMerge.style]);
                }
                else if (isOn(key)) {
                    const existing = ret[key];
                    const incoming = toMerge[key];
                    if (existing !== incoming) {
                        ret[key] = existing
                            ? [].concat(existing, toMerge[key])
                            : incoming;
                    }
                }
                else if (key !== '') {
                    ret[key] = toMerge[key];
                }
            }
        }
        return ret;
    }

    function provide(key, value) {
        if (!currentInstance) {
            {
                warn(`provide() can only be used inside setup().`);
            }
        }
        else {
            let provides = currentInstance.provides;
            // by default an instance inherits its parent's provides object
            // but when it needs to provide values of its own, it creates its
            // own provides object using parent provides object as prototype.
            // this way in `inject` we can simply look up injections from direct
            // parent and let the prototype chain do the work.
            const parentProvides = currentInstance.parent && currentInstance.parent.provides;
            if (parentProvides === provides) {
                provides = currentInstance.provides = Object.create(parentProvides);
            }
            // TS doesn't allow symbol as index type
            provides[key] = value;
        }
    }
    function inject(key, defaultValue, treatDefaultAsFactory = false) {
        // fallback to `currentRenderingInstance` so that this can be called in
        // a functional component
        const instance = currentInstance || currentRenderingInstance;
        if (instance) {
            // #2400
            // to support `app.use` plugins,
            // fallback to appContext's `provides` if the intance is at root
            const provides = instance.parent == null
                ? instance.vnode.appContext && instance.vnode.appContext.provides
                : instance.parent.provides;
            if (provides && key in provides) {
                // TS doesn't allow symbol as index type
                return provides[key];
            }
            else if (arguments.length > 1) {
                return treatDefaultAsFactory && isFunction(defaultValue)
                    ? defaultValue()
                    : defaultValue;
            }
            else {
                warn(`injection "${String(key)}" not found.`);
            }
        }
        else {
            warn(`inject() can only be used inside setup() or functional components.`);
        }
    }

    function createDuplicateChecker() {
        const cache = Object.create(null);
        return (type, key) => {
            if (cache[key]) {
                warn(`${type} property "${key}" is already defined in ${cache[key]}.`);
            }
            else {
                cache[key] = type;
            }
        };
    }
    let isInBeforeCreate = false;
    function applyOptions(instance, options, deferredData = [], deferredWatch = [], deferredProvide = [], asMixin = false) {
        const {
            // composition
            mixins, extends: extendsOptions,
            // state
            data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions,
            // assets
            components, directives,
            // lifecycle
            beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured,
            // public API
            expose } = options;
        const publicThis = instance.proxy;
        const ctx = instance.ctx;
        const globalMixins = instance.appContext.mixins;
        if (asMixin && render && instance.render === NOOP) {
            instance.render = render;
        }
        // applyOptions is called non-as-mixin once per instance
        if (!asMixin) {
            isInBeforeCreate = true;
            callSyncHook('beforeCreate', "bc" /* BEFORE_CREATE */, options, instance, globalMixins);
            isInBeforeCreate = false;
            // global mixins are applied first
            applyMixins(instance, globalMixins, deferredData, deferredWatch, deferredProvide);
        }
        // extending a base component...
        if (extendsOptions) {
            applyOptions(instance, extendsOptions, deferredData, deferredWatch, deferredProvide, true);
        }
        // local mixins
        if (mixins) {
            applyMixins(instance, mixins, deferredData, deferredWatch, deferredProvide);
        }
        const checkDuplicateProperties = createDuplicateChecker();
        {
            const [propsOptions] = instance.propsOptions;
            if (propsOptions) {
                for (const key in propsOptions) {
                    checkDuplicateProperties("Props" /* PROPS */, key);
                }
            }
        }
        // options initialization order (to be consistent with Vue 2):
        // - props (already done outside of this function)
        // - inject
        // - methods
        // - data (deferred since it relies on `this` access)
        // - computed
        // - watch (deferred since it relies on `this` access)
        if (injectOptions) {
            if (isArray(injectOptions)) {
                for (let i = 0; i < injectOptions.length; i++) {
                    const key = injectOptions[i];
                    ctx[key] = inject(key);
                    {
                        checkDuplicateProperties("Inject" /* INJECT */, key);
                    }
                }
            }
            else {
                for (const key in injectOptions) {
                    const opt = injectOptions[key];
                    if (isObject(opt)) {
                        ctx[key] = inject(opt.from || key, opt.default, true /* treat default function as factory */);
                    }
                    else {
                        ctx[key] = inject(opt);
                    }
                    {
                        checkDuplicateProperties("Inject" /* INJECT */, key);
                    }
                }
            }
        }
        if (methods) {
            for (const key in methods) {
                const methodHandler = methods[key];
                if (isFunction(methodHandler)) {
                    // In dev mode, we use the `createRenderContext` function to define methods to the proxy target,
                    // and those are read-only but reconfigurable, so it needs to be redefined here
                    {
                        Object.defineProperty(ctx, key, {
                            value: methodHandler.bind(publicThis),
                            configurable: true,
                            enumerable: true,
                            writable: true
                        });
                    }
                    {
                        checkDuplicateProperties("Methods" /* METHODS */, key);
                    }
                }
                else {
                    warn(`Method "${key}" has type "${typeof methodHandler}" in the component definition. ` +
                        `Did you reference the function correctly?`);
                }
            }
        }
        if (!asMixin) {
            if (deferredData.length) {
                deferredData.forEach(dataFn => resolveData(instance, dataFn, publicThis));
            }
            if (dataOptions) {
                // @ts-ignore dataOptions is not fully type safe
                resolveData(instance, dataOptions, publicThis);
            }
            {
                const rawData = toRaw(instance.data);
                for (const key in rawData) {
                    checkDuplicateProperties("Data" /* DATA */, key);
                    // expose data on ctx during dev
                    if (key[0] !== '$' && key[0] !== '_') {
                        Object.defineProperty(ctx, key, {
                            configurable: true,
                            enumerable: true,
                            get: () => rawData[key],
                            set: NOOP
                        });
                    }
                }
            }
        }
        else if (dataOptions) {
            deferredData.push(dataOptions);
        }
        if (computedOptions) {
            for (const key in computedOptions) {
                const opt = computedOptions[key];
                const get = isFunction(opt)
                    ? opt.bind(publicThis, publicThis)
                    : isFunction(opt.get)
                        ? opt.get.bind(publicThis, publicThis)
                        : NOOP;
                if (get === NOOP) {
                    warn(`Computed property "${key}" has no getter.`);
                }
                const set = !isFunction(opt) && isFunction(opt.set)
                    ? opt.set.bind(publicThis)
                    : () => {
                        warn(`Write operation failed: computed property "${key}" is readonly.`);
                    }
                    ;
                const c = computed$1({
                    get,
                    set
                });
                Object.defineProperty(ctx, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => c.value,
                    set: v => (c.value = v)
                });
                {
                    checkDuplicateProperties("Computed" /* COMPUTED */, key);
                }
            }
        }
        if (watchOptions) {
            deferredWatch.push(watchOptions);
        }
        if (!asMixin && deferredWatch.length) {
            deferredWatch.forEach(watchOptions => {
                for (const key in watchOptions) {
                    createWatcher(watchOptions[key], ctx, publicThis, key);
                }
            });
        }
        if (provideOptions) {
            deferredProvide.push(provideOptions);
        }
        if (!asMixin && deferredProvide.length) {
            deferredProvide.forEach(provideOptions => {
                const provides = isFunction(provideOptions)
                    ? provideOptions.call(publicThis)
                    : provideOptions;
                Reflect.ownKeys(provides).forEach(key => {
                    provide(key, provides[key]);
                });
            });
        }
        // asset options.
        // To reduce memory usage, only components with mixins or extends will have
        // resolved asset registry attached to instance.
        if (asMixin) {
            if (components) {
                extend(instance.components ||
                    (instance.components = extend({}, instance.type.components)), components);
            }
            if (directives) {
                extend(instance.directives ||
                    (instance.directives = extend({}, instance.type.directives)), directives);
            }
        }
        // lifecycle options
        if (!asMixin) {
            callSyncHook('created', "c" /* CREATED */, options, instance, globalMixins);
        }
        if (beforeMount) {
            onBeforeMount(beforeMount.bind(publicThis));
        }
        if (mounted) {
            onMounted(mounted.bind(publicThis));
        }
        if (beforeUpdate) {
            onBeforeUpdate(beforeUpdate.bind(publicThis));
        }
        if (updated) {
            onUpdated(updated.bind(publicThis));
        }
        if (activated) {
            onActivated(activated.bind(publicThis));
        }
        if (deactivated) {
            onDeactivated(deactivated.bind(publicThis));
        }
        if (errorCaptured) {
            onErrorCaptured(errorCaptured.bind(publicThis));
        }
        if (renderTracked) {
            onRenderTracked(renderTracked.bind(publicThis));
        }
        if (renderTriggered) {
            onRenderTriggered(renderTriggered.bind(publicThis));
        }
        if (beforeDestroy) {
            warn(`\`beforeDestroy\` has been renamed to \`beforeUnmount\`.`);
        }
        if (beforeUnmount) {
            onBeforeUnmount(beforeUnmount.bind(publicThis));
        }
        if (destroyed) {
            warn(`\`destroyed\` has been renamed to \`unmounted\`.`);
        }
        if (unmounted) {
            onUnmounted(unmounted.bind(publicThis));
        }
        if (isArray(expose)) {
            if (!asMixin) {
                if (expose.length) {
                    const exposed = instance.exposed || (instance.exposed = proxyRefs({}));
                    expose.forEach(key => {
                        exposed[key] = toRef(publicThis, key);
                    });
                }
                else if (!instance.exposed) {
                    instance.exposed = EMPTY_OBJ;
                }
            }
            else {
                warn(`The \`expose\` option is ignored when used in mixins.`);
            }
        }
    }
    function callSyncHook(name, type, options, instance, globalMixins) {
        callHookFromMixins(name, type, globalMixins, instance);
        const { extends: base, mixins } = options;
        if (base) {
            callHookFromExtends(name, type, base, instance);
        }
        if (mixins) {
            callHookFromMixins(name, type, mixins, instance);
        }
        const selfHook = options[name];
        if (selfHook) {
            callWithAsyncErrorHandling(selfHook.bind(instance.proxy), instance, type);
        }
    }
    function callHookFromExtends(name, type, base, instance) {
        if (base.extends) {
            callHookFromExtends(name, type, base.extends, instance);
        }
        const baseHook = base[name];
        if (baseHook) {
            callWithAsyncErrorHandling(baseHook.bind(instance.proxy), instance, type);
        }
    }
    function callHookFromMixins(name, type, mixins, instance) {
        for (let i = 0; i < mixins.length; i++) {
            const chainedMixins = mixins[i].mixins;
            if (chainedMixins) {
                callHookFromMixins(name, type, chainedMixins, instance);
            }
            const fn = mixins[i][name];
            if (fn) {
                callWithAsyncErrorHandling(fn.bind(instance.proxy), instance, type);
            }
        }
    }
    function applyMixins(instance, mixins, deferredData, deferredWatch, deferredProvide) {
        for (let i = 0; i < mixins.length; i++) {
            applyOptions(instance, mixins[i], deferredData, deferredWatch, deferredProvide, true);
        }
    }
    function resolveData(instance, dataFn, publicThis) {
        if (!isFunction(dataFn)) {
            warn(`The data option must be a function. ` +
                `Plain object usage is no longer supported.`);
        }
        const data = dataFn.call(publicThis, publicThis);
        if (isPromise(data)) {
            warn(`data() returned a Promise - note data() cannot be async; If you ` +
                `intend to perform data fetching before component renders, use ` +
                `async setup() + <Suspense>.`);
        }
        if (!isObject(data)) {
            warn(`data() should return an object.`);
        }
        else if (instance.data === EMPTY_OBJ) {
            instance.data = reactive(data);
        }
        else {
            // existing data: this is a mixin or extends.
            extend(instance.data, data);
        }
    }
    function createWatcher(raw, ctx, publicThis, key) {
        const getter = key.includes('.')
            ? createPathGetter(publicThis, key)
            : () => publicThis[key];
        if (isString(raw)) {
            const handler = ctx[raw];
            if (isFunction(handler)) {
                watch(getter, handler);
            }
            else {
                warn(`Invalid watch handler specified by key "${raw}"`, handler);
            }
        }
        else if (isFunction(raw)) {
            watch(getter, raw.bind(publicThis));
        }
        else if (isObject(raw)) {
            if (isArray(raw)) {
                raw.forEach(r => createWatcher(r, ctx, publicThis, key));
            }
            else {
                const handler = isFunction(raw.handler)
                    ? raw.handler.bind(publicThis)
                    : ctx[raw.handler];
                if (isFunction(handler)) {
                    watch(getter, handler, raw);
                }
                else {
                    warn(`Invalid watch handler specified by key "${raw.handler}"`, handler);
                }
            }
        }
        else {
            warn(`Invalid watch option: "${key}"`, raw);
        }
    }
    function createPathGetter(ctx, path) {
        const segments = path.split('.');
        return () => {
            let cur = ctx;
            for (let i = 0; i < segments.length && cur; i++) {
                cur = cur[segments[i]];
            }
            return cur;
        };
    }
    function resolveMergedOptions(instance) {
        const raw = instance.type;
        const { __merged, mixins, extends: extendsOptions } = raw;
        if (__merged)
            return __merged;
        const globalMixins = instance.appContext.mixins;
        if (!globalMixins.length && !mixins && !extendsOptions)
            return raw;
        const options = {};
        globalMixins.forEach(m => mergeOptions(options, m, instance));
        mergeOptions(options, raw, instance);
        return (raw.__merged = options);
    }
    function mergeOptions(to, from, instance) {
        const strats = instance.appContext.config.optionMergeStrategies;
        const { mixins, extends: extendsOptions } = from;
        extendsOptions && mergeOptions(to, extendsOptions, instance);
        mixins &&
            mixins.forEach((m) => mergeOptions(to, m, instance));
        for (const key in from) {
            if (strats && hasOwn(strats, key)) {
                to[key] = strats[key](to[key], from[key], instance.proxy, key);
            }
            else {
                to[key] = from[key];
            }
        }
    }

    /**
     * #2437 In Vue 3, functional components do not have a public instance proxy but
     * they exist in the internal parent chain. For code that relies on traversing
     * public $parent chains, skip functional ones and go to the parent instead.
     */
    const getPublicInstance = (i) => {
        if (!i)
            return null;
        if (isStatefulComponent(i))
            return i.exposed ? i.exposed : i.proxy;
        return getPublicInstance(i.parent);
    };
    const publicPropertiesMap = extend(Object.create(null), {
        $: i => i,
        $el: i => i.vnode.el,
        $data: i => i.data,
        $props: i => (shallowReadonly(i.props)),
        $attrs: i => (shallowReadonly(i.attrs)),
        $slots: i => (shallowReadonly(i.slots)),
        $refs: i => (shallowReadonly(i.refs)),
        $parent: i => getPublicInstance(i.parent),
        $root: i => getPublicInstance(i.root),
        $emit: i => i.emit,
        $options: i => (resolveMergedOptions(i)),
        $forceUpdate: i => () => queueJob(i.update),
        $nextTick: i => nextTick.bind(i.proxy),
        $watch: i => (instanceWatch.bind(i))
    });
    const PublicInstanceProxyHandlers = {
        get({ _: instance }, key) {
            const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
            // let @vue/reactivity know it should never observe Vue public instances.
            if (key === "__v_skip" /* SKIP */) {
                return true;
            }
            // for internal formatters to know that this is a Vue instance
            if (key === '__isVue') {
                return true;
            }
            // data / props / ctx
            // This getter gets called for every property access on the render context
            // during render and is a major hotspot. The most expensive part of this
            // is the multiple hasOwn() calls. It's much faster to do a simple property
            // access on a plain object, so we use an accessCache object (with null
            // prototype) to memoize what access type a key corresponds to.
            let normalizedProps;
            if (key[0] !== '$') {
                const n = accessCache[key];
                if (n !== undefined) {
                    switch (n) {
                        case 0 /* SETUP */:
                            return setupState[key];
                        case 1 /* DATA */:
                            return data[key];
                        case 3 /* CONTEXT */:
                            return ctx[key];
                        case 2 /* PROPS */:
                            return props[key];
                        // default: just fallthrough
                    }
                }
                else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                    accessCache[key] = 0 /* SETUP */;
                    return setupState[key];
                }
                else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                    accessCache[key] = 1 /* DATA */;
                    return data[key];
                }
                else if (
                    // only cache other properties when instance has declared (thus stable)
                    // props
                    (normalizedProps = instance.propsOptions[0]) &&
                    hasOwn(normalizedProps, key)) {
                    accessCache[key] = 2 /* PROPS */;
                    return props[key];
                }
                else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                    accessCache[key] = 3 /* CONTEXT */;
                    return ctx[key];
                }
                else if (!isInBeforeCreate) {
                    accessCache[key] = 4 /* OTHER */;
                }
            }
            const publicGetter = publicPropertiesMap[key];
            let cssModule, globalProperties;
            // public $xxx properties
            if (publicGetter) {
                if (key === '$attrs') {
                    track(instance, "get" /* GET */, key);
                    markAttrsAccessed();
                }
                return publicGetter(instance);
            }
            else if (
                // css module (injected by vue-loader)
                (cssModule = type.__cssModules) &&
                (cssModule = cssModule[key])) {
                return cssModule;
            }
            else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                // user may set custom properties to `this` that start with `$`
                accessCache[key] = 3 /* CONTEXT */;
                return ctx[key];
            }
            else if (
                // global properties
                ((globalProperties = appContext.config.globalProperties),
                    hasOwn(globalProperties, key))) {
                return globalProperties[key];
            }
            else if (currentRenderingInstance &&
                (!isString(key) ||
                    // #1091 avoid internal isRef/isVNode checks on component instance leading
                    // to infinite warning loop
                    key.indexOf('__v') !== 0)) {
                if (data !== EMPTY_OBJ &&
                    (key[0] === '$' || key[0] === '_') &&
                    hasOwn(data, key)) {
                    warn(`Property ${JSON.stringify(key)} must be accessed via $data because it starts with a reserved ` +
                        `character ("$" or "_") and is not proxied on the render context.`);
                }
                else if (instance === currentRenderingInstance) {
                    warn(`Property ${JSON.stringify(key)} was accessed during render ` +
                        `but is not defined on instance.`);
                }
            }
        },
        set({ _: instance }, key, value) {
            const { data, setupState, ctx } = instance;
            if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                setupState[key] = value;
            }
            else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                data[key] = value;
            }
            else if (hasOwn(instance.props, key)) {
                warn(`Attempting to mutate prop "${key}". Props are readonly.`, instance);
                return false;
            }
            if (key[0] === '$' && key.slice(1) in instance) {
                warn(`Attempting to mutate public property "${key}". ` +
                    `Properties starting with $ are reserved and readonly.`, instance);
                return false;
            }
            else {
                if (key in instance.appContext.config.globalProperties) {
                    Object.defineProperty(ctx, key, {
                        enumerable: true,
                        configurable: true,
                        value
                    });
                }
                else {
                    ctx[key] = value;
                }
            }
            return true;
        },
        has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
            let normalizedProps;
            return (accessCache[key] !== undefined ||
                (data !== EMPTY_OBJ && hasOwn(data, key)) ||
                (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
                ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
                hasOwn(ctx, key) ||
                hasOwn(publicPropertiesMap, key) ||
                hasOwn(appContext.config.globalProperties, key));
        }
    };
    {
        PublicInstanceProxyHandlers.ownKeys = (target) => {
            warn(`Avoid app logic that relies on enumerating keys on a component instance. ` +
                `The keys will be empty in production mode to avoid performance overhead.`);
            return Reflect.ownKeys(target);
        };
    }
    const RuntimeCompiledPublicInstanceProxyHandlers = extend({}, PublicInstanceProxyHandlers, {
        get(target, key) {
            // fast path for unscopables when using `with` block
            if (key === Symbol.unscopables) {
                return;
            }
            return PublicInstanceProxyHandlers.get(target, key, target);
        },
        has(_, key) {
            const has = key[0] !== '_' && !isGloballyWhitelisted(key);
            if (!has && PublicInstanceProxyHandlers.has(_, key)) {
                warn(`Property ${JSON.stringify(key)} should not start with _ which is a reserved prefix for Vue internals.`);
            }
            return has;
        }
    });
    // In dev mode, the proxy target exposes the same properties as seen on `this`
    // for easier console inspection. In prod mode it will be an empty object so
    // these properties definitions can be skipped.
    function createRenderContext(instance) {
        const target = {};
        // expose internal instance for proxy handlers
        Object.defineProperty(target, `_`, {
            configurable: true,
            enumerable: false,
            get: () => instance
        });
        // expose public properties
        Object.keys(publicPropertiesMap).forEach(key => {
            Object.defineProperty(target, key, {
                configurable: true,
                enumerable: false,
                get: () => publicPropertiesMap[key](instance),
                // intercepted by the proxy so no need for implementation,
                // but needed to prevent set errors
                set: NOOP
            });
        });
        // expose global properties
        const { globalProperties } = instance.appContext.config;
        Object.keys(globalProperties).forEach(key => {
            Object.defineProperty(target, key, {
                configurable: true,
                enumerable: false,
                get: () => globalProperties[key],
                set: NOOP
            });
        });
        return target;
    }
    // dev only
    function exposePropsOnRenderContext(instance) {
        const { ctx, propsOptions: [propsOptions] } = instance;
        if (propsOptions) {
            Object.keys(propsOptions).forEach(key => {
                Object.defineProperty(ctx, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => instance.props[key],
                    set: NOOP
                });
            });
        }
    }
    // dev only
    function exposeSetupStateOnRenderContext(instance) {
        const { ctx, setupState } = instance;
        Object.keys(toRaw(setupState)).forEach(key => {
            if (key[0] === '$' || key[0] === '_') {
                warn(`setup() return property ${JSON.stringify(key)} should not start with "$" or "_" ` +
                    `which are reserved prefixes for Vue internals.`);
                return;
            }
            Object.defineProperty(ctx, key, {
                enumerable: true,
                configurable: true,
                get: () => setupState[key],
                set: NOOP
            });
        });
    }

    const emptyAppContext = createAppContext();
    let uid$2 = 0;
    function createComponentInstance(vnode, parent, suspense) {
        const type = vnode.type;
        // inherit parent app context - or - if root, adopt from root vnode
        const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
        const instance = {
            uid: uid$2++,
            vnode,
            type,
            parent,
            appContext,
            root: null,
            next: null,
            subTree: null,
            update: null,
            render: null,
            proxy: null,
            exposed: null,
            withProxy: null,
            effects: null,
            provides: parent ? parent.provides : Object.create(appContext.provides),
            accessCache: null,
            renderCache: [],
            // local resovled assets
            components: null,
            directives: null,
            // resolved props and emits options
            propsOptions: normalizePropsOptions(type, appContext),
            emitsOptions: normalizeEmitsOptions(type, appContext),
            // emit
            emit: null,
            emitted: null,
            // state
            ctx: EMPTY_OBJ,
            data: EMPTY_OBJ,
            props: EMPTY_OBJ,
            attrs: EMPTY_OBJ,
            slots: EMPTY_OBJ,
            refs: EMPTY_OBJ,
            setupState: EMPTY_OBJ,
            setupContext: null,
            // suspense related
            suspense,
            suspenseId: suspense ? suspense.pendingId : 0,
            asyncDep: null,
            asyncResolved: false,
            // lifecycle hooks
            // not using enums here because it results in computed properties
            isMounted: false,
            isUnmounted: false,
            isDeactivated: false,
            bc: null,
            c: null,
            bm: null,
            m: null,
            bu: null,
            u: null,
            um: null,
            bum: null,
            da: null,
            a: null,
            rtg: null,
            rtc: null,
            ec: null
        };
        {
            instance.ctx = createRenderContext(instance);
        }
        instance.root = parent ? parent.root : instance;
        instance.emit = emit.bind(null, instance);
        return instance;
    }
    let currentInstance = null;
    const getCurrentInstance = () => currentInstance || currentRenderingInstance;
    const setCurrentInstance = (instance) => {
        currentInstance = instance;
    };
    const isBuiltInTag = /*#__PURE__*/ makeMap('slot,component');
    function validateComponentName(name, config) {
        const appIsNativeTag = config.isNativeTag || NO;
        if (isBuiltInTag(name) || appIsNativeTag(name)) {
            warn('Do not use built-in or reserved HTML elements as component id: ' + name);
        }
    }
    function isStatefulComponent(instance) {
        return instance.vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
    }
    let isInSSRComponentSetup = false;
    function setupComponent(instance, isSSR = false) {
        isInSSRComponentSetup = isSSR;
        const { props, children } = instance.vnode;
        const isStateful = isStatefulComponent(instance);
        initProps(instance, props, isStateful, isSSR);
        initSlots(instance, children);
        const setupResult = isStateful
            ? setupStatefulComponent(instance, isSSR)
            : undefined;
        isInSSRComponentSetup = false;
        return setupResult;
    }
    function setupStatefulComponent(instance, isSSR) {
        const Component = instance.type;
        {
            if (Component.name) {
                validateComponentName(Component.name, instance.appContext.config);
            }
            if (Component.components) {
                const names = Object.keys(Component.components);
                for (let i = 0; i < names.length; i++) {
                    validateComponentName(names[i], instance.appContext.config);
                }
            }
            if (Component.directives) {
                const names = Object.keys(Component.directives);
                for (let i = 0; i < names.length; i++) {
                    validateDirectiveName(names[i]);
                }
            }
        }
        // 0. create render proxy property access cache
        instance.accessCache = Object.create(null);
        // 1. create public instance / render proxy
        // also mark it raw so it's never observed
        instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
        {
            exposePropsOnRenderContext(instance);
        }
        // 2. call setup()
        const { setup } = Component;
        if (setup) {
            const setupContext = (instance.setupContext =
                setup.length > 1 ? createSetupContext(instance) : null);
            currentInstance = instance;
            pauseTracking();
            const setupResult = callWithErrorHandling(setup, instance, 0 /* SETUP_FUNCTION */, [shallowReadonly(instance.props), setupContext]);
            resetTracking();
            currentInstance = null;
            if (isPromise(setupResult)) {
                if (isSSR) {
                    // return the promise so server-renderer can wait on it
                    return setupResult.then((resolvedResult) => {
                        handleSetupResult(instance, resolvedResult);
                    });
                }
                else {
                    // async setup returned Promise.
                    // bail here and wait for re-entry.
                    instance.asyncDep = setupResult;
                }
            }
            else {
                handleSetupResult(instance, setupResult);
            }
        }
        else {
            finishComponentSetup(instance);
        }
    }
    function handleSetupResult(instance, setupResult, isSSR) {
        if (isFunction(setupResult)) {
            // setup returned an inline render function
            {
                instance.render = setupResult;
            }
        }
        else if (isObject(setupResult)) {
            if (isVNode(setupResult)) {
                warn(`setup() should not return VNodes directly - ` +
                    `return a render function instead.`);
            }
            // setup returned bindings.
            // assuming a render function compiled from template is present.
            {
                instance.devtoolsRawSetupState = setupResult;
            }
            instance.setupState = proxyRefs(setupResult);
            {
                exposeSetupStateOnRenderContext(instance);
            }
        }
        else if (setupResult !== undefined) {
            warn(`setup() should return an object. Received: ${setupResult === null ? 'null' : typeof setupResult}`);
        }
        finishComponentSetup(instance);
    }
    let compile;
    // dev only
    const isRuntimeOnly = () => !compile;
    /**
     * For runtime-dom to register the compiler.
     * Note the exported method uses any to avoid d.ts relying on the compiler types.
     */
    function registerRuntimeCompiler(_compile) {
        compile = _compile;
    }
    function finishComponentSetup(instance, isSSR) {
        const Component = instance.type;
        // template / render function normalization
        if (!instance.render) {
            // could be set from setup()
            if (compile && Component.template && !Component.render) {
                {
                    startMeasure(instance, `compile`);
                }
                Component.render = compile(Component.template, {
                    isCustomElement: instance.appContext.config.isCustomElement,
                    delimiters: Component.delimiters
                });
                {
                    endMeasure(instance, `compile`);
                }
            }
            instance.render = (Component.render || NOOP);
            // for runtime-compiled render functions using `with` blocks, the render
            // proxy used needs a different `has` handler which is more performant and
            // also only allows a whitelist of globals to fallthrough.
            if (instance.render._rc) {
                instance.withProxy = new Proxy(instance.ctx, RuntimeCompiledPublicInstanceProxyHandlers);
            }
        }
        // support for 2.x options
        {
            currentInstance = instance;
            pauseTracking();
            applyOptions(instance, Component);
            resetTracking();
            currentInstance = null;
        }
        // warn missing template/render
        if (!Component.render && instance.render === NOOP) {
            /* istanbul ignore if */
            if (!compile && Component.template) {
                warn(`Component provided template option but ` +
                    `runtime compilation is not supported in this build of Vue.` +
                    (` Use "vue.global.js" instead.`
                    ) /* should not happen */);
            }
            else {
                warn(`Component is missing template or render function.`);
            }
        }
    }
    const attrHandlers = {
        get: (target, key) => {
            {
                markAttrsAccessed();
            }
            return target[key];
        },
        set: () => {
            warn(`setupContext.attrs is readonly.`);
            return false;
        },
        deleteProperty: () => {
            warn(`setupContext.attrs is readonly.`);
            return false;
        }
    };
    function createSetupContext(instance) {
        const expose = exposed => {
            if (instance.exposed) {
                warn(`expose() should be called only once per setup().`);
            }
            instance.exposed = proxyRefs(exposed);
        };
        {
            // We use getters in dev in case libs like test-utils overwrite instance
            // properties (overwrites should not be done in prod)
            return Object.freeze({
                get props() {
                    return instance.props;
                },
                get attrs() {
                    return new Proxy(instance.attrs, attrHandlers);
                },
                get slots() {
                    return shallowReadonly(instance.slots);
                },
                get emit() {
                    return (event, ...args) => instance.emit(event, ...args);
                },
                expose
            });
        }
    }
    // record effects created during a component's setup() so that they can be
    // stopped when the component unmounts
    function recordInstanceBoundEffect(effect, instance = currentInstance) {
        if (instance) {
            (instance.effects || (instance.effects = [])).push(effect);
        }
    }
    const classifyRE = /(?:^|[-_])(\w)/g;
    const classify = (str) => str.replace(classifyRE, c => c.toUpperCase()).replace(/[-_]/g, '');
    function getComponentName(Component) {
        return isFunction(Component)
            ? Component.displayName || Component.name
            : Component.name;
    }
    /* istanbul ignore next */
    function formatComponentName(instance, Component, isRoot = false) {
        let name = getComponentName(Component);
        if (!name && Component.__file) {
            const match = Component.__file.match(/([^/\\]+)\.\w+$/);
            if (match) {
                name = match[1];
            }
        }
        if (!name && instance && instance.parent) {
            // try to infer the name based on reverse resolution
            const inferFromRegistry = (registry) => {
                for (const key in registry) {
                    if (registry[key] === Component) {
                        return key;
                    }
                }
            };
            name =
                inferFromRegistry(instance.components ||
                    instance.parent.type.components) || inferFromRegistry(instance.appContext.components);
        }
        return name ? classify(name) : isRoot ? `App` : `Anonymous`;
    }
    function isClassComponent(value) {
        return isFunction(value) && '__vccOpts' in value;
    }

    function computed$1(getterOrOptions) {
        const c = computed(getterOrOptions);
        recordInstanceBoundEffect(c.effect);
        return c;
    }

    // implementation
    function defineProps() {
        {
            warn(`defineProps() is a compiler-hint helper that is only usable inside ` +
                `<script setup> of a single file component. Its arguments should be ` +
                `compiled away and passing it at runtime has no effect.`);
        }
        return null;
    }
    // implementation
    function defineEmit() {
        {
            warn(`defineEmit() is a compiler-hint helper that is only usable inside ` +
                `<script setup> of a single file component. Its arguments should be ` +
                `compiled away and passing it at runtime has no effect.`);
        }
        return null;
    }
    function useContext() {
        const i = getCurrentInstance();
        if (!i) {
            warn(`useContext() called without active instance.`);
        }
        return i.setupContext || (i.setupContext = createSetupContext(i));
    }

    // Actual implementation
    function h(type, propsOrChildren, children) {
        const l = arguments.length;
        if (l === 2) {
            if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
                // single vnode without props
                if (isVNode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                // props without children
                return createVNode(type, propsOrChildren);
            }
            else {
                // omit props
                return createVNode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3 && isVNode(children)) {
                children = [children];
            }
            return createVNode(type, propsOrChildren, children);
        }
    }

    const ssrContextKey = Symbol(`ssrContext`);
    const useSSRContext = () => {
        {
            warn(`useSSRContext() is not supported in the global build.`);
        }
    };

    function initCustomFormatter() {
        /* eslint-disable no-restricted-globals */
        if (typeof window === 'undefined') {
            return;
        }
        const vueStyle = { style: 'color:#3ba776' };
        const numberStyle = { style: 'color:#0b1bc9' };
        const stringStyle = { style: 'color:#b62e24' };
        const keywordStyle = { style: 'color:#9d288c' };
        // custom formatter for Chrome
        // https://www.mattzeunert.com/2016/02/19/custom-chrome-devtools-object-formatters.html
        const formatter = {
            header(obj) {
                // TODO also format ComponentPublicInstance & ctx.slots/attrs in setup
                if (!isObject(obj)) {
                    return null;
                }
                if (obj.__isVue) {
                    return ['div', vueStyle, `VueInstance`];
                }
                else if (isRef(obj)) {
                    return [
                        'div',
                        {},
                        ['span', vueStyle, genRefFlag(obj)],
                        '<',
                        formatValue(obj.value),
                        `>`
                    ];
                }
                else if (isReactive(obj)) {
                    return [
                        'div',
                        {},
                        ['span', vueStyle, 'Reactive'],
                        '<',
                        formatValue(obj),
                        `>${isReadonly(obj) ? ` (readonly)` : ``}`
                    ];
                }
                else if (isReadonly(obj)) {
                    return [
                        'div',
                        {},
                        ['span', vueStyle, 'Readonly'],
                        '<',
                        formatValue(obj),
                        '>'
                    ];
                }
                return null;
            },
            hasBody(obj) {
                return obj && obj.__isVue;
            },
            body(obj) {
                if (obj && obj.__isVue) {
                    return [
                        'div',
                        {},
                        ...formatInstance(obj.$)
                    ];
                }
            }
        };
        function formatInstance(instance) {
            const blocks = [];
            if (instance.type.props && instance.props) {
                blocks.push(createInstanceBlock('props', toRaw(instance.props)));
            }
            if (instance.setupState !== EMPTY_OBJ) {
                blocks.push(createInstanceBlock('setup', instance.setupState));
            }
            if (instance.data !== EMPTY_OBJ) {
                blocks.push(createInstanceBlock('data', toRaw(instance.data)));
            }
            const computed = extractKeys(instance, 'computed');
            if (computed) {
                blocks.push(createInstanceBlock('computed', computed));
            }
            const injected = extractKeys(instance, 'inject');
            if (injected) {
                blocks.push(createInstanceBlock('injected', injected));
            }
            blocks.push([
                'div',
                {},
                [
                    'span',
                    {
                        style: keywordStyle.style + ';opacity:0.66'
                    },
                    '$ (internal): '
                ],
                ['object', { object: instance }]
            ]);
            return blocks;
        }
        function createInstanceBlock(type, target) {
            target = extend({}, target);
            if (!Object.keys(target).length) {
                return ['span', {}];
            }
            return [
                'div',
                { style: 'line-height:1.25em;margin-bottom:0.6em' },
                [
                    'div',
                    {
                        style: 'color:#476582'
                    },
                    type
                ],
                [
                    'div',
                    {
                        style: 'padding-left:1.25em'
                    },
                    ...Object.keys(target).map(key => {
                        return [
                            'div',
                            {},
                            ['span', keywordStyle, key + ': '],
                            formatValue(target[key], false)
                        ];
                    })
                ]
            ];
        }
        function formatValue(v, asRaw = true) {
            if (typeof v === 'number') {
                return ['span', numberStyle, v];
            }
            else if (typeof v === 'string') {
                return ['span', stringStyle, JSON.stringify(v)];
            }
            else if (typeof v === 'boolean') {
                return ['span', keywordStyle, v];
            }
            else if (isObject(v)) {
                return ['object', { object: asRaw ? toRaw(v) : v }];
            }
            else {
                return ['span', stringStyle, String(v)];
            }
        }
        function extractKeys(instance, type) {
            const Comp = instance.type;
            if (isFunction(Comp)) {
                return;
            }
            const extracted = {};
            for (const key in instance.ctx) {
                if (isKeyOfType(Comp, key, type)) {
                    extracted[key] = instance.ctx[key];
                }
            }
            return extracted;
        }
        function isKeyOfType(Comp, key, type) {
            const opts = Comp[type];
            if ((isArray(opts) && opts.includes(key)) ||
                (isObject(opts) && key in opts)) {
                return true;
            }
            if (Comp.extends && isKeyOfType(Comp.extends, key, type)) {
                return true;
            }
            if (Comp.mixins && Comp.mixins.some(m => isKeyOfType(m, key, type))) {
                return true;
            }
        }
        function genRefFlag(v) {
            if (v._shallow) {
                return `ShallowRef`;
            }
            if (v.effect) {
                return `ComputedRef`;
            }
            return `Ref`;
        }
        if (window.devtoolsFormatters) {
            window.devtoolsFormatters.push(formatter);
        }
        else {
            window.devtoolsFormatters = [formatter];
        }
    }

    /**
     * Actual implementation
     */
    function renderList(source, renderItem) {
        let ret;
        if (isArray(source) || isString(source)) {
            ret = new Array(source.length);
            for (let i = 0, l = source.length; i < l; i++) {
                ret[i] = renderItem(source[i], i);
            }
        }
        else if (typeof source === 'number') {
            if (!Number.isInteger(source)) {
                warn(`The v-for range expect an integer value but got ${source}.`);
                return [];
            }
            ret = new Array(source);
            for (let i = 0; i < source; i++) {
                ret[i] = renderItem(i + 1, i);
            }
        }
        else if (isObject(source)) {
            if (source[Symbol.iterator]) {
                ret = Array.from(source, renderItem);
            }
            else {
                const keys = Object.keys(source);
                ret = new Array(keys.length);
                for (let i = 0, l = keys.length; i < l; i++) {
                    const key = keys[i];
                    ret[i] = renderItem(source[key], key, i);
                }
            }
        }
        else {
            ret = [];
        }
        return ret;
    }

    /**
     * For prefixing keys in v-on="obj" with "on"
     * @private
     */
    function toHandlers(obj) {
        const ret = {};
        if (!isObject(obj)) {
            warn(`v-on with no argument expects an object value.`);
            return ret;
        }
        for (const key in obj) {
            ret[toHandlerKey(key)] = obj[key];
        }
        return ret;
    }

    /**
     * Compiler runtime helper for creating dynamic slots object
     * @private
     */
    function createSlots(slots, dynamicSlots) {
        for (let i = 0; i < dynamicSlots.length; i++) {
            const slot = dynamicSlots[i];
            // array of dynamic slot generated by <template v-for="..." #[...]>
            if (isArray(slot)) {
                for (let j = 0; j < slot.length; j++) {
                    slots[slot[j].name] = slot[j].fn;
                }
            }
            else if (slot) {
                // conditional single slot generated by <template v-if="..." #foo>
                slots[slot.name] = slot.fn;
            }
        }
        return slots;
    }

    // Core API ------------------------------------------------------------------
    const version = "3.0.7";
    /**
     * SSR utils for \@vue/server-renderer. Only exposed in cjs builds.
     * @internal
     */
    const ssrUtils = (null);

    const svgNS = 'http://www.w3.org/2000/svg';
    const doc = (typeof document !== 'undefined' ? document : null);
    let tempContainer;
    let tempSVGContainer;
    const nodeOps = {
        insert: (child, parent, anchor) => {
            parent.insertBefore(child, anchor || null);
        },
        remove: child => {
            const parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        createElement: (tag, isSVG, is) => isSVG
            ? doc.createElementNS(svgNS, tag)
            : doc.createElement(tag, is ? { is } : undefined),
        createText: text => doc.createTextNode(text),
        createComment: text => doc.createComment(text),
        setText: (node, text) => {
            node.nodeValue = text;
        },
        setElementText: (el, text) => {
            el.textContent = text;
        },
        parentNode: node => node.parentNode,
        nextSibling: node => node.nextSibling,
        querySelector: selector => doc.querySelector(selector),
        setScopeId(el, id) {
            el.setAttribute(id, '');
        },
        cloneNode(el) {
            return el.cloneNode(true);
        },
        // __UNSAFE__
        // Reason: innerHTML.
        // Static content here can only come from compiled templates.
        // As long as the user only uses trusted templates, this is safe.
        insertStaticContent(content, parent, anchor, isSVG) {
            const temp = isSVG
                ? tempSVGContainer ||
                (tempSVGContainer = doc.createElementNS(svgNS, 'svg'))
                : tempContainer || (tempContainer = doc.createElement('div'));
            temp.innerHTML = content;
            const first = temp.firstChild;
            let node = first;
            let last = node;
            while (node) {
                last = node;
                nodeOps.insert(node, parent, anchor);
                node = temp.firstChild;
            }
            return [first, last];
        }
    };

    // compiler should normalize class + :class bindings on the same element
    // into a single binding ['staticClass', dynamic]
    function patchClass(el, value, isSVG) {
        if (value == null) {
            value = '';
        }
        if (isSVG) {
            el.setAttribute('class', value);
        }
        else {
            // directly setting className should be faster than setAttribute in theory
            // if this is an element during a transition, take the temporary transition
            // classes into account.
            const transitionClasses = el._vtc;
            if (transitionClasses) {
                value = (value
                    ? [value, ...transitionClasses]
                    : [...transitionClasses]).join(' ');
            }
            el.className = value;
        }
    }

    function patchStyle(el, prev, next) {
        const style = el.style;
        if (!next) {
            el.removeAttribute('style');
        }
        else if (isString(next)) {
            if (prev !== next) {
                const current = style.display;
                style.cssText = next;
                // indicates that the `display` of the element is controlled by `v-show`,
                // so we always keep the current `display` value regardless of the `style` value,
                // thus handing over control to `v-show`.
                if ('_vod' in el) {
                    style.display = current;
                }
            }
        }
        else {
            for (const key in next) {
                setStyle(style, key, next[key]);
            }
            if (prev && !isString(prev)) {
                for (const key in prev) {
                    if (next[key] == null) {
                        setStyle(style, key, '');
                    }
                }
            }
        }
    }
    const importantRE = /\s*!important$/;
    function setStyle(style, name, val) {
        if (isArray(val)) {
            val.forEach(v => setStyle(style, name, v));
        }
        else {
            if (name.startsWith('--')) {
                // custom property definition
                style.setProperty(name, val);
            }
            else {
                const prefixed = autoPrefix(style, name);
                if (importantRE.test(val)) {
                    // !important
                    style.setProperty(hyphenate(prefixed), val.replace(importantRE, ''), 'important');
                }
                else {
                    style[prefixed] = val;
                }
            }
        }
    }
    const prefixes = ['Webkit', 'Moz', 'ms'];
    const prefixCache = {};
    function autoPrefix(style, rawName) {
        const cached = prefixCache[rawName];
        if (cached) {
            return cached;
        }
        let name = camelize(rawName);
        if (name !== 'filter' && name in style) {
            return (prefixCache[rawName] = name);
        }
        name = capitalize(name);
        for (let i = 0; i < prefixes.length; i++) {
            const prefixed = prefixes[i] + name;
            if (prefixed in style) {
                return (prefixCache[rawName] = prefixed);
            }
        }
        return rawName;
    }

    const xlinkNS = 'http://www.w3.org/1999/xlink';
    function patchAttr(el, key, value, isSVG) {
        if (isSVG && key.startsWith('xlink:')) {
            if (value == null) {
                el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
            }
            else {
                el.setAttributeNS(xlinkNS, key, value);
            }
        }
        else {
            // note we are only checking boolean attributes that don't have a
            // corresponding dom prop of the same name here.
            const isBoolean = isSpecialBooleanAttr(key);
            if (value == null || (isBoolean && value === false)) {
                el.removeAttribute(key);
            }
            else {
                el.setAttribute(key, isBoolean ? '' : value);
            }
        }
    }

    // __UNSAFE__
    // functions. The user is responsible for using them with only trusted content.
    function patchDOMProp(el, key, value,
        // the following args are passed only due to potential innerHTML/textContent
        // overriding existing VNodes, in which case the old tree must be properly
        // unmounted.
        prevChildren, parentComponent, parentSuspense, unmountChildren) {
        if (key === 'innerHTML' || key === 'textContent') {
            if (prevChildren) {
                unmountChildren(prevChildren, parentComponent, parentSuspense);
            }
            el[key] = value == null ? '' : value;
            return;
        }
        if (key === 'value' && el.tagName !== 'PROGRESS') {
            // store value as _value as well since
            // non-string values will be stringified.
            el._value = value;
            const newValue = value == null ? '' : value;
            if (el.value !== newValue) {
                el.value = newValue;
            }
            return;
        }
        if (value === '' || value == null) {
            const type = typeof el[key];
            if (value === '' && type === 'boolean') {
                // e.g. <select multiple> compiles to { multiple: '' }
                el[key] = true;
                return;
            }
            else if (value == null && type === 'string') {
                // e.g. <div :id="null">
                el[key] = '';
                el.removeAttribute(key);
                return;
            }
            else if (type === 'number') {
                // e.g. <img :width="null">
                el[key] = 0;
                el.removeAttribute(key);
                return;
            }
        }
        // some properties perform value validation and throw
        try {
            el[key] = value;
        }
        catch (e) {
            {
                warn(`Failed setting prop "${key}" on <${el.tagName.toLowerCase()}>: ` +
                    `value ${value} is invalid.`, e);
            }
        }
    }

    // Async edge case fix requires storing an event listener's attach timestamp.
    let _getNow = Date.now;
    // Determine what event timestamp the browser is using. Annoyingly, the
    // timestamp can either be hi-res (relative to page load) or low-res
    // (relative to UNIX epoch), so in order to compare time we have to use the
    // same timestamp type when saving the flush timestamp.
    if (typeof document !== 'undefined' &&
        _getNow() > document.createEvent('Event').timeStamp) {
        // if the low-res timestamp which is bigger than the event timestamp
        // (which is evaluated AFTER) it means the event is using a hi-res timestamp,
        // and we need to use the hi-res version for event listeners as well.
        _getNow = () => performance.now();
    }
    // To avoid the overhead of repeatedly calling performance.now(), we cache
    // and use the same timestamp for all event listeners attached in the same tick.
    let cachedNow = 0;
    const p = Promise.resolve();
    const reset = () => {
        cachedNow = 0;
    };
    const getNow = () => cachedNow || (p.then(reset), (cachedNow = _getNow()));
    function addEventListener(el, event, handler, options) {
        el.addEventListener(event, handler, options);
    }
    function removeEventListener(el, event, handler, options) {
        el.removeEventListener(event, handler, options);
    }
    function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
        // vei = vue event invokers
        const invokers = el._vei || (el._vei = {});
        const existingInvoker = invokers[rawName];
        if (nextValue && existingInvoker) {
            // patch
            existingInvoker.value = nextValue;
        }
        else {
            const [name, options] = parseName(rawName);
            if (nextValue) {
                // add
                const invoker = (invokers[rawName] = createInvoker(nextValue, instance));
                addEventListener(el, name, invoker, options);
            }
            else if (existingInvoker) {
                // remove
                removeEventListener(el, name, existingInvoker, options);
                invokers[rawName] = undefined;
            }
        }
    }
    const optionsModifierRE = /(?:Once|Passive|Capture)$/;
    function parseName(name) {
        let options;
        if (optionsModifierRE.test(name)) {
            options = {};
            let m;
            while ((m = name.match(optionsModifierRE))) {
                name = name.slice(0, name.length - m[0].length);
                options[m[0].toLowerCase()] = true;
            }
        }
        return [hyphenate(name.slice(2)), options];
    }
    function createInvoker(initialValue, instance) {
        const invoker = (e) => {
            // async edge case #6566: inner click event triggers patch, event handler
            // attached to outer element during patch, and triggered again. This
            // happens because browsers fire microtask ticks between event propagation.
            // the solution is simple: we save the timestamp when a handler is attached,
            // and the handler would only fire if the event passed to it was fired
            // AFTER it was attached.
            const timeStamp = e.timeStamp || _getNow();
            if (timeStamp >= invoker.attached - 1) {
                callWithAsyncErrorHandling(patchStopImmediatePropagation(e, invoker.value), instance, 5 /* NATIVE_EVENT_HANDLER */, [e]);
            }
        };
        invoker.value = initialValue;
        invoker.attached = getNow();
        return invoker;
    }
    function patchStopImmediatePropagation(e, value) {
        if (isArray(value)) {
            const originalStop = e.stopImmediatePropagation;
            e.stopImmediatePropagation = () => {
                originalStop.call(e);
                e._stopped = true;
            };
            return value.map(fn => (e) => !e._stopped && fn(e));
        }
        else {
            return value;
        }
    }

    const nativeOnRE = /^on[a-z]/;
    const forcePatchProp = (_, key) => key === 'value';
    const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
        switch (key) {
            // special
            case 'class':
                patchClass(el, nextValue, isSVG);
                break;
            case 'style':
                patchStyle(el, prevValue, nextValue);
                break;
            default:
                if (isOn(key)) {
                    // ignore v-model listeners
                    if (!isModelListener(key)) {
                        patchEvent(el, key, prevValue, nextValue, parentComponent);
                    }
                }
                else if (shouldSetAsProp(el, key, nextValue, isSVG)) {
                    patchDOMProp(el, key, nextValue, prevChildren, parentComponent, parentSuspense, unmountChildren);
                }
                else {
                    // special case for <input v-model type="checkbox"> with
                    // :true-value & :false-value
                    // store value as dom properties since non-string values will be
                    // stringified.
                    if (key === 'true-value') {
                        el._trueValue = nextValue;
                    }
                    else if (key === 'false-value') {
                        el._falseValue = nextValue;
                    }
                    patchAttr(el, key, nextValue, isSVG);
                }
                break;
        }
    };
    function shouldSetAsProp(el, key, value, isSVG) {
        if (isSVG) {
            // most keys must be set as attribute on svg elements to work
            // ...except innerHTML
            if (key === 'innerHTML') {
                return true;
            }
            // or native onclick with function values
            if (key in el && nativeOnRE.test(key) && isFunction(value)) {
                return true;
            }
            return false;
        }
        // spellcheck and draggable are numerated attrs, however their
        // corresponding DOM properties are actually booleans - this leads to
        // setting it with a string "false" value leading it to be coerced to
        // `true`, so we need to always treat them as attributes.
        // Note that `contentEditable` doesn't have this problem: its DOM
        // property is also enumerated string values.
        if (key === 'spellcheck' || key === 'draggable') {
            return false;
        }
        // #1787, #2840 form property on form elements is readonly and must be set as
        // attribute.
        if (key === 'form') {
            return false;
        }
        // #1526 <input list> must be set as attribute
        if (key === 'list' && el.tagName === 'INPUT') {
            return false;
        }
        // #2766 <textarea type> must be set as attribute
        if (key === 'type' && el.tagName === 'TEXTAREA') {
            return false;
        }
        // native onclick with string value, must be set as attribute
        if (nativeOnRE.test(key) && isString(value)) {
            return false;
        }
        return key in el;
    }

    function useCssModule(name = '$style') {
        /* istanbul ignore else */
        {
            {
                warn(`useCssModule() is not supported in the global build.`);
            }
            return EMPTY_OBJ;
        }
    }

    /**
     * Runtime helper for SFC's CSS variable injection feature.
     * @private
     */
    function useCssVars(getter) {
        const instance = getCurrentInstance();
        /* istanbul ignore next */
        if (!instance) {
            warn(`useCssVars is called without current active component instance.`);
            return;
        }
        const setVars = () => setVarsOnVNode(instance.subTree, getter(instance.proxy));
        onMounted(() => watchEffect(setVars, { flush: 'post' }));
        onUpdated(setVars);
    }
    function setVarsOnVNode(vnode, vars) {
        if (vnode.shapeFlag & 128 /* SUSPENSE */) {
            const suspense = vnode.suspense;
            vnode = suspense.activeBranch;
            if (suspense.pendingBranch && !suspense.isHydrating) {
                suspense.effects.push(() => {
                    setVarsOnVNode(suspense.activeBranch, vars);
                });
            }
        }
        // drill down HOCs until it's a non-component vnode
        while (vnode.component) {
            vnode = vnode.component.subTree;
        }
        if (vnode.shapeFlag & 1 /* ELEMENT */ && vnode.el) {
            const style = vnode.el.style;
            for (const key in vars) {
                style.setProperty(`--${key}`, vars[key]);
            }
        }
        else if (vnode.type === Fragment) {
            vnode.children.forEach(c => setVarsOnVNode(c, vars));
        }
    }

    const TRANSITION = 'transition';
    const ANIMATION = 'animation';
    // DOM Transition is a higher-order-component based on the platform-agnostic
    // base Transition component, with DOM-specific logic.
    const Transition = (props, { slots }) => h(BaseTransition, resolveTransitionProps(props), slots);
    Transition.displayName = 'Transition';
    const DOMTransitionPropsValidators = {
        name: String,
        type: String,
        css: {
            type: Boolean,
            default: true
        },
        duration: [String, Number, Object],
        enterFromClass: String,
        enterActiveClass: String,
        enterToClass: String,
        appearFromClass: String,
        appearActiveClass: String,
        appearToClass: String,
        leaveFromClass: String,
        leaveActiveClass: String,
        leaveToClass: String
    };
    const TransitionPropsValidators = (Transition.props = /*#__PURE__*/ extend({}, BaseTransition.props, DOMTransitionPropsValidators));
    function resolveTransitionProps(rawProps) {
        let { name = 'v', type, css = true, duration, enterFromClass = `${name}-enter-from`, enterActiveClass = `${name}-enter-active`, enterToClass = `${name}-enter-to`, appearFromClass = enterFromClass, appearActiveClass = enterActiveClass, appearToClass = enterToClass, leaveFromClass = `${name}-leave-from`, leaveActiveClass = `${name}-leave-active`, leaveToClass = `${name}-leave-to` } = rawProps;
        const baseProps = {};
        for (const key in rawProps) {
            if (!(key in DOMTransitionPropsValidators)) {
                baseProps[key] = rawProps[key];
            }
        }
        if (!css) {
            return baseProps;
        }
        const durations = normalizeDuration(duration);
        const enterDuration = durations && durations[0];
        const leaveDuration = durations && durations[1];
        const { onBeforeEnter, onEnter, onEnterCancelled, onLeave, onLeaveCancelled, onBeforeAppear = onBeforeEnter, onAppear = onEnter, onAppearCancelled = onEnterCancelled } = baseProps;
        const finishEnter = (el, isAppear, done) => {
            removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
            removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
            done && done();
        };
        const finishLeave = (el, done) => {
            removeTransitionClass(el, leaveToClass);
            removeTransitionClass(el, leaveActiveClass);
            done && done();
        };
        const makeEnterHook = (isAppear) => {
            return (el, done) => {
                const hook = isAppear ? onAppear : onEnter;
                const resolve = () => finishEnter(el, isAppear, done);
                hook && hook(el, resolve);
                nextFrame(() => {
                    removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
                    addTransitionClass(el, isAppear ? appearToClass : enterToClass);
                    if (!(hook && hook.length > 1)) {
                        whenTransitionEnds(el, type, enterDuration, resolve);
                    }
                });
            };
        };
        return extend(baseProps, {
            onBeforeEnter(el) {
                onBeforeEnter && onBeforeEnter(el);
                addTransitionClass(el, enterFromClass);
                addTransitionClass(el, enterActiveClass);
            },
            onBeforeAppear(el) {
                onBeforeAppear && onBeforeAppear(el);
                addTransitionClass(el, appearFromClass);
                addTransitionClass(el, appearActiveClass);
            },
            onEnter: makeEnterHook(false),
            onAppear: makeEnterHook(true),
            onLeave(el, done) {
                const resolve = () => finishLeave(el, done);
                addTransitionClass(el, leaveFromClass);
                // force reflow so *-leave-from classes immediately take effect (#2593)
                forceReflow();
                addTransitionClass(el, leaveActiveClass);
                nextFrame(() => {
                    removeTransitionClass(el, leaveFromClass);
                    addTransitionClass(el, leaveToClass);
                    if (!(onLeave && onLeave.length > 1)) {
                        whenTransitionEnds(el, type, leaveDuration, resolve);
                    }
                });
                onLeave && onLeave(el, resolve);
            },
            onEnterCancelled(el) {
                finishEnter(el, false);
                onEnterCancelled && onEnterCancelled(el);
            },
            onAppearCancelled(el) {
                finishEnter(el, true);
                onAppearCancelled && onAppearCancelled(el);
            },
            onLeaveCancelled(el) {
                finishLeave(el);
                onLeaveCancelled && onLeaveCancelled(el);
            }
        });
    }
    function normalizeDuration(duration) {
        if (duration == null) {
            return null;
        }
        else if (isObject(duration)) {
            return [NumberOf(duration.enter), NumberOf(duration.leave)];
        }
        else {
            const n = NumberOf(duration);
            return [n, n];
        }
    }
    function NumberOf(val) {
        const res = toNumber(val);
        validateDuration(res);
        return res;
    }
    function validateDuration(val) {
        if (typeof val !== 'number') {
            warn(`<transition> explicit duration is not a valid number - ` +
                `got ${JSON.stringify(val)}.`);
        }
        else if (isNaN(val)) {
            warn(`<transition> explicit duration is NaN - ` +
                'the duration expression might be incorrect.');
        }
    }
    function addTransitionClass(el, cls) {
        cls.split(/\s+/).forEach(c => c && el.classList.add(c));
        (el._vtc ||
            (el._vtc = new Set())).add(cls);
    }
    function removeTransitionClass(el, cls) {
        cls.split(/\s+/).forEach(c => c && el.classList.remove(c));
        const { _vtc } = el;
        if (_vtc) {
            _vtc.delete(cls);
            if (!_vtc.size) {
                el._vtc = undefined;
            }
        }
    }
    function nextFrame(cb) {
        requestAnimationFrame(() => {
            requestAnimationFrame(cb);
        });
    }
    let endId = 0;
    function whenTransitionEnds(el, expectedType, explicitTimeout, resolve) {
        const id = (el._endId = ++endId);
        const resolveIfNotStale = () => {
            if (id === el._endId) {
                resolve();
            }
        };
        if (explicitTimeout) {
            return setTimeout(resolveIfNotStale, explicitTimeout);
        }
        const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
        if (!type) {
            return resolve();
        }
        const endEvent = type + 'end';
        let ended = 0;
        const end = () => {
            el.removeEventListener(endEvent, onEnd);
            resolveIfNotStale();
        };
        const onEnd = (e) => {
            if (e.target === el && ++ended >= propCount) {
                end();
            }
        };
        setTimeout(() => {
            if (ended < propCount) {
                end();
            }
        }, timeout + 1);
        el.addEventListener(endEvent, onEnd);
    }
    function getTransitionInfo(el, expectedType) {
        const styles = window.getComputedStyle(el);
        // JSDOM may return undefined for transition properties
        const getStyleProperties = (key) => (styles[key] || '').split(', ');
        const transitionDelays = getStyleProperties(TRANSITION + 'Delay');
        const transitionDurations = getStyleProperties(TRANSITION + 'Duration');
        const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
        const animationDelays = getStyleProperties(ANIMATION + 'Delay');
        const animationDurations = getStyleProperties(ANIMATION + 'Duration');
        const animationTimeout = getTimeout(animationDelays, animationDurations);
        let type = null;
        let timeout = 0;
        let propCount = 0;
        /* istanbul ignore if */
        if (expectedType === TRANSITION) {
            if (transitionTimeout > 0) {
                type = TRANSITION;
                timeout = transitionTimeout;
                propCount = transitionDurations.length;
            }
        }
        else if (expectedType === ANIMATION) {
            if (animationTimeout > 0) {
                type = ANIMATION;
                timeout = animationTimeout;
                propCount = animationDurations.length;
            }
        }
        else {
            timeout = Math.max(transitionTimeout, animationTimeout);
            type =
                timeout > 0
                    ? transitionTimeout > animationTimeout
                        ? TRANSITION
                        : ANIMATION
                    : null;
            propCount = type
                ? type === TRANSITION
                    ? transitionDurations.length
                    : animationDurations.length
                : 0;
        }
        const hasTransform = type === TRANSITION &&
            /\b(transform|all)(,|$)/.test(styles[TRANSITION + 'Property']);
        return {
            type,
            timeout,
            propCount,
            hasTransform
        };
    }
    function getTimeout(delays, durations) {
        while (delays.length < durations.length) {
            delays = delays.concat(delays);
        }
        return Math.max(...durations.map((d, i) => toMs(d) + toMs(delays[i])));
    }
    // Old versions of Chromium (below 61.0.3163.100) formats floating pointer
    // numbers in a locale-dependent way, using a comma instead of a dot.
    // If comma is not replaced with a dot, the input will be rounded down
    // (i.e. acting as a floor function) causing unexpected behaviors
    function toMs(s) {
        return Number(s.slice(0, -1).replace(',', '.')) * 1000;
    }
    // synchronously force layout to put elements into a certain state
    function forceReflow() {
        return document.body.offsetHeight;
    }

    const positionMap = new WeakMap();
    const newPositionMap = new WeakMap();
    const TransitionGroupImpl = {
        name: 'TransitionGroup',
        props: /*#__PURE__*/ extend({}, TransitionPropsValidators, {
            tag: String,
            moveClass: String
        }),
        setup(props, { slots }) {
            const instance = getCurrentInstance();
            const state = useTransitionState();
            let prevChildren;
            let children;
            onUpdated(() => {
                // children is guaranteed to exist after initial render
                if (!prevChildren.length) {
                    return;
                }
                const moveClass = props.moveClass || `${props.name || 'v'}-move`;
                if (!hasCSSTransform(prevChildren[0].el, instance.vnode.el, moveClass)) {
                    return;
                }
                // we divide the work into three loops to avoid mixing DOM reads and writes
                // in each iteration - which helps prevent layout thrashing.
                prevChildren.forEach(callPendingCbs);
                prevChildren.forEach(recordPosition);
                const movedChildren = prevChildren.filter(applyTranslation);
                // force reflow to put everything in position
                forceReflow();
                movedChildren.forEach(c => {
                    const el = c.el;
                    const style = el.style;
                    addTransitionClass(el, moveClass);
                    style.transform = style.webkitTransform = style.transitionDuration = '';
                    const cb = (el._moveCb = (e) => {
                        if (e && e.target !== el) {
                            return;
                        }
                        if (!e || /transform$/.test(e.propertyName)) {
                            el.removeEventListener('transitionend', cb);
                            el._moveCb = null;
                            removeTransitionClass(el, moveClass);
                        }
                    });
                    el.addEventListener('transitionend', cb);
                });
            });
            return () => {
                const rawProps = toRaw(props);
                const cssTransitionProps = resolveTransitionProps(rawProps);
                const tag = rawProps.tag || Fragment;
                prevChildren = children;
                children = slots.default ? getTransitionRawChildren(slots.default()) : [];
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (child.key != null) {
                        setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
                    }
                    else {
                        warn(`<TransitionGroup> children must be keyed.`);
                    }
                }
                if (prevChildren) {
                    for (let i = 0; i < prevChildren.length; i++) {
                        const child = prevChildren[i];
                        setTransitionHooks(child, resolveTransitionHooks(child, cssTransitionProps, state, instance));
                        positionMap.set(child, child.el.getBoundingClientRect());
                    }
                }
                return createVNode(tag, null, children);
            };
        }
    };
    const TransitionGroup = TransitionGroupImpl;
    function callPendingCbs(c) {
        const el = c.el;
        if (el._moveCb) {
            el._moveCb();
        }
        if (el._enterCb) {
            el._enterCb();
        }
    }
    function recordPosition(c) {
        newPositionMap.set(c, c.el.getBoundingClientRect());
    }
    function applyTranslation(c) {
        const oldPos = positionMap.get(c);
        const newPos = newPositionMap.get(c);
        const dx = oldPos.left - newPos.left;
        const dy = oldPos.top - newPos.top;
        if (dx || dy) {
            const s = c.el.style;
            s.transform = s.webkitTransform = `translate(${dx}px,${dy}px)`;
            s.transitionDuration = '0s';
            return c;
        }
    }
    function hasCSSTransform(el, root, moveClass) {
        // Detect whether an element with the move class applied has
        // CSS transitions. Since the element may be inside an entering
        // transition at this very moment, we make a clone of it and remove
        // all other transition classes applied to ensure only the move class
        // is applied.
        const clone = el.cloneNode();
        if (el._vtc) {
            el._vtc.forEach(cls => {
                cls.split(/\s+/).forEach(c => c && clone.classList.remove(c));
            });
        }
        moveClass.split(/\s+/).forEach(c => c && clone.classList.add(c));
        clone.style.display = 'none';
        const container = (root.nodeType === 1
            ? root
            : root.parentNode);
        container.appendChild(clone);
        const { hasTransform } = getTransitionInfo(clone);
        container.removeChild(clone);
        return hasTransform;
    }

    const getModelAssigner = (vnode) => {
        const fn = vnode.props['onUpdate:modelValue'];
        return isArray(fn) ? value => invokeArrayFns(fn, value) : fn;
    };
    function onCompositionStart(e) {
        e.target.composing = true;
    }
    function onCompositionEnd(e) {
        const target = e.target;
        if (target.composing) {
            target.composing = false;
            trigger$1(target, 'input');
        }
    }
    function trigger$1(el, type) {
        const e = document.createEvent('HTMLEvents');
        e.initEvent(type, true, true);
        el.dispatchEvent(e);
    }
    // We are exporting the v-model runtime directly as vnode hooks so that it can
    // be tree-shaken in case v-model is never used.
    const vModelText = {
        created(el, { modifiers: { lazy, trim, number } }, vnode) {
            el._assign = getModelAssigner(vnode);
            const castToNumber = number || el.type === 'number';
            addEventListener(el, lazy ? 'change' : 'input', e => {
                if (e.target.composing)
                    return;
                let domValue = el.value;
                if (trim) {
                    domValue = domValue.trim();
                }
                else if (castToNumber) {
                    domValue = toNumber(domValue);
                }
                el._assign(domValue);
            });
            if (trim) {
                addEventListener(el, 'change', () => {
                    el.value = el.value.trim();
                });
            }
            if (!lazy) {
                addEventListener(el, 'compositionstart', onCompositionStart);
                addEventListener(el, 'compositionend', onCompositionEnd);
                // Safari < 10.2 & UIWebView doesn't fire compositionend when
                // switching focus before confirming composition choice
                // this also fixes the issue where some browsers e.g. iOS Chrome
                // fires "change" instead of "input" on autocomplete.
                addEventListener(el, 'change', onCompositionEnd);
            }
        },
        // set value on mounted so it's after min/max for type="range"
        mounted(el, { value }) {
            el.value = value == null ? '' : value;
        },
        beforeUpdate(el, { value, modifiers: { trim, number } }, vnode) {
            el._assign = getModelAssigner(vnode);
            // avoid clearing unresolved text. #2302
            if (el.composing)
                return;
            if (document.activeElement === el) {
                if (trim && el.value.trim() === value) {
                    return;
                }
                if ((number || el.type === 'number') && toNumber(el.value) === value) {
                    return;
                }
            }
            const newValue = value == null ? '' : value;
            if (el.value !== newValue) {
                el.value = newValue;
            }
        }
    };
    const vModelCheckbox = {
        created(el, _, vnode) {
            el._assign = getModelAssigner(vnode);
            addEventListener(el, 'change', () => {
                const modelValue = el._modelValue;
                const elementValue = getValue(el);
                const checked = el.checked;
                const assign = el._assign;
                if (isArray(modelValue)) {
                    const index = looseIndexOf(modelValue, elementValue);
                    const found = index !== -1;
                    if (checked && !found) {
                        assign(modelValue.concat(elementValue));
                    }
                    else if (!checked && found) {
                        const filtered = [...modelValue];
                        filtered.splice(index, 1);
                        assign(filtered);
                    }
                }
                else if (isSet(modelValue)) {
                    const cloned = new Set(modelValue);
                    if (checked) {
                        cloned.add(elementValue);
                    }
                    else {
                        cloned.delete(elementValue);
                    }
                    assign(cloned);
                }
                else {
                    assign(getCheckboxValue(el, checked));
                }
            });
        },
        // set initial checked on mount to wait for true-value/false-value
        mounted: setChecked,
        beforeUpdate(el, binding, vnode) {
            el._assign = getModelAssigner(vnode);
            setChecked(el, binding, vnode);
        }
    };
    function setChecked(el, { value, oldValue }, vnode) {
        el._modelValue = value;
        if (isArray(value)) {
            el.checked = looseIndexOf(value, vnode.props.value) > -1;
        }
        else if (isSet(value)) {
            el.checked = value.has(vnode.props.value);
        }
        else if (value !== oldValue) {
            el.checked = looseEqual(value, getCheckboxValue(el, true));
        }
    }
    const vModelRadio = {
        created(el, { value }, vnode) {
            el.checked = looseEqual(value, vnode.props.value);
            el._assign = getModelAssigner(vnode);
            addEventListener(el, 'change', () => {
                el._assign(getValue(el));
            });
        },
        beforeUpdate(el, { value, oldValue }, vnode) {
            el._assign = getModelAssigner(vnode);
            if (value !== oldValue) {
                el.checked = looseEqual(value, vnode.props.value);
            }
        }
    };
    const vModelSelect = {
        created(el, { value, modifiers: { number } }, vnode) {
            const isSetModel = isSet(value);
            addEventListener(el, 'change', () => {
                const selectedVal = Array.prototype.filter
                    .call(el.options, (o) => o.selected)
                    .map((o) => number ? toNumber(getValue(o)) : getValue(o));
                el._assign(el.multiple
                    ? isSetModel
                        ? new Set(selectedVal)
                        : selectedVal
                    : selectedVal[0]);
            });
            el._assign = getModelAssigner(vnode);
        },
        // set value in mounted & updated because <select> relies on its children
        // <option>s.
        mounted(el, { value }) {
            setSelected(el, value);
        },
        beforeUpdate(el, _binding, vnode) {
            el._assign = getModelAssigner(vnode);
        },
        updated(el, { value }) {
            setSelected(el, value);
        }
    };
    function setSelected(el, value) {
        const isMultiple = el.multiple;
        if (isMultiple && !isArray(value) && !isSet(value)) {
            warn(`<select multiple v-model> expects an Array or Set value for its binding, ` +
                `but got ${Object.prototype.toString.call(value).slice(8, -1)}.`);
            return;
        }
        for (let i = 0, l = el.options.length; i < l; i++) {
            const option = el.options[i];
            const optionValue = getValue(option);
            if (isMultiple) {
                if (isArray(value)) {
                    option.selected = looseIndexOf(value, optionValue) > -1;
                }
                else {
                    option.selected = value.has(optionValue);
                }
            }
            else {
                if (looseEqual(getValue(option), value)) {
                    el.selectedIndex = i;
                    return;
                }
            }
        }
        if (!isMultiple) {
            el.selectedIndex = -1;
        }
    }
    // retrieve raw value set via :value bindings
    function getValue(el) {
        return '_value' in el ? el._value : el.value;
    }
    // retrieve raw value for true-value and false-value set via :true-value or :false-value bindings
    function getCheckboxValue(el, checked) {
        const key = checked ? '_trueValue' : '_falseValue';
        return key in el ? el[key] : checked;
    }
    const vModelDynamic = {
        created(el, binding, vnode) {
            callModelHook(el, binding, vnode, null, 'created');
        },
        mounted(el, binding, vnode) {
            callModelHook(el, binding, vnode, null, 'mounted');
        },
        beforeUpdate(el, binding, vnode, prevVNode) {
            callModelHook(el, binding, vnode, prevVNode, 'beforeUpdate');
        },
        updated(el, binding, vnode, prevVNode) {
            callModelHook(el, binding, vnode, prevVNode, 'updated');
        }
    };
    function callModelHook(el, binding, vnode, prevVNode, hook) {
        let modelToUse;
        switch (el.tagName) {
            case 'SELECT':
                modelToUse = vModelSelect;
                break;
            case 'TEXTAREA':
                modelToUse = vModelText;
                break;
            default:
                switch (vnode.props && vnode.props.type) {
                    case 'checkbox':
                        modelToUse = vModelCheckbox;
                        break;
                    case 'radio':
                        modelToUse = vModelRadio;
                        break;
                    default:
                        modelToUse = vModelText;
                }
        }
        const fn = modelToUse[hook];
        fn && fn(el, binding, vnode, prevVNode);
    }

    const systemModifiers = ['ctrl', 'shift', 'alt', 'meta'];
    const modifierGuards = {
        stop: e => e.stopPropagation(),
        prevent: e => e.preventDefault(),
        self: e => e.target !== e.currentTarget,
        ctrl: e => !e.ctrlKey,
        shift: e => !e.shiftKey,
        alt: e => !e.altKey,
        meta: e => !e.metaKey,
        left: e => 'button' in e && e.button !== 0,
        middle: e => 'button' in e && e.button !== 1,
        right: e => 'button' in e && e.button !== 2,
        exact: (e, modifiers) => systemModifiers.some(m => e[`${m}Key`] && !modifiers.includes(m))
    };
    /**
     * @private
     */
    const withModifiers = (fn, modifiers) => {
        return (event, ...args) => {
            for (let i = 0; i < modifiers.length; i++) {
                const guard = modifierGuards[modifiers[i]];
                if (guard && guard(event, modifiers))
                    return;
            }
            return fn(event, ...args);
        };
    };
    // Kept for 2.x compat.
    // Note: IE11 compat for `spacebar` and `del` is removed for now.
    const keyNames = {
        esc: 'escape',
        space: ' ',
        up: 'arrow-up',
        left: 'arrow-left',
        right: 'arrow-right',
        down: 'arrow-down',
        delete: 'backspace'
    };
    /**
     * @private
     */
    const withKeys = (fn, modifiers) => {
        return (event) => {
            if (!('key' in event))
                return;
            const eventKey = hyphenate(event.key);
            if (
                // None of the provided key modifiers match the current event key
                !modifiers.some(k => k === eventKey || keyNames[k] === eventKey)) {
                return;
            }
            return fn(event);
        };
    };

    const vShow = {
        beforeMount(el, { value }, { transition }) {
            el._vod = el.style.display === 'none' ? '' : el.style.display;
            if (transition && value) {
                transition.beforeEnter(el);
            }
            else {
                setDisplay(el, value);
            }
        },
        mounted(el, { value }, { transition }) {
            if (transition && value) {
                transition.enter(el);
            }
        },
        updated(el, { value, oldValue }, { transition }) {
            if (!value === !oldValue)
                return;
            if (transition) {
                if (value) {
                    transition.beforeEnter(el);
                    setDisplay(el, true);
                    transition.enter(el);
                }
                else {
                    transition.leave(el, () => {
                        setDisplay(el, false);
                    });
                }
            }
            else {
                setDisplay(el, value);
            }
        },
        beforeUnmount(el, { value }) {
            setDisplay(el, value);
        }
    };
    function setDisplay(el, value) {
        el.style.display = value ? el._vod : 'none';
    }

    const rendererOptions = extend({ patchProp, forcePatchProp }, nodeOps);
    // lazy create the renderer - this makes core renderer logic tree-shakable
    // in case the user only imports reactivity utilities from Vue.
    let renderer;
    let enabledHydration = false;
    function ensureRenderer() {
        return renderer || (renderer = createRenderer(rendererOptions));
    }
    function ensureHydrationRenderer() {
        renderer = enabledHydration
            ? renderer
            : createHydrationRenderer(rendererOptions);
        enabledHydration = true;
        return renderer;
    }
    // use explicit type casts here to avoid import() calls in rolled-up d.ts
    const render = ((...args) => {
        ensureRenderer().render(...args);
    });
    const hydrate = ((...args) => {
        ensureHydrationRenderer().hydrate(...args);
    });
    const createApp = ((...args) => {
        const app = ensureRenderer().createApp(...args);
        {
            injectNativeTagCheck(app);
            injectCustomElementCheck(app);
        }
        const { mount } = app;
        app.mount = (containerOrSelector) => {
            const container = normalizeContainer(containerOrSelector);
            if (!container)
                return;
            const component = app._component;
            if (!isFunction(component) && !component.render && !component.template) {
                component.template = container.innerHTML;
            }
            // clear content before mounting
            container.innerHTML = '';
            const proxy = mount(container);
            if (container instanceof Element) {
                container.removeAttribute('v-cloak');
                container.setAttribute('data-v-app', '');
            }
            return proxy;
        };
        return app;
    });
    const createSSRApp = ((...args) => {
        const app = ensureHydrationRenderer().createApp(...args);
        {
            injectNativeTagCheck(app);
            injectCustomElementCheck(app);
        }
        const { mount } = app;
        app.mount = (containerOrSelector) => {
            const container = normalizeContainer(containerOrSelector);
            if (container) {
                return mount(container, true);
            }
        };
        return app;
    });
    function injectNativeTagCheck(app) {
        // Inject `isNativeTag`
        // this is used for component name validation (dev only)
        Object.defineProperty(app.config, 'isNativeTag', {
            value: (tag) => isHTMLTag(tag) || isSVGTag(tag),
            writable: false
        });
    }
    // dev only
    function injectCustomElementCheck(app) {
        if (isRuntimeOnly()) {
            const value = app.config.isCustomElement;
            Object.defineProperty(app.config, 'isCustomElement', {
                get() {
                    return value;
                },
                set() {
                    warn(`The \`isCustomElement\` config option is only respected when using the runtime compiler.` +
                        `If you are using the runtime-only build, \`isCustomElement\` must be passed to \`@vue/compiler-dom\` in the build setup instead` +
                        `- for example, via the \`compilerOptions\` option in vue-loader: https://vue-loader.vuejs.org/options.html#compileroptions.`);
                }
            });
        }
    }
    function normalizeContainer(container) {
        if (isString(container)) {
            const res = document.querySelector(container);
            if (!res) {
                warn(`Failed to mount app: mount target selector "${container}" returned null.`);
            }
            return res;
        }
        if (container instanceof window.ShadowRoot &&
            container.mode === 'closed') {
            warn(`mounting on a ShadowRoot with \`{mode: "closed"}\` may lead to unpredictable bugs`);
        }
        return container;
    }

    function initDev() {
        {
            {
                console.info(`You are running a development build of Vue.\n` +
                    `Make sure to use the production build (*.prod.js) when deploying for production.`);
            }
            initCustomFormatter();
        }
    }

    function defaultOnError(error) {
        throw error;
    }
    function createCompilerError(code, loc, messages, additionalMessage) {
        const msg = (messages || errorMessages)[code] + (additionalMessage || ``)
            ;
        const error = new SyntaxError(String(msg));
        error.code = code;
        error.loc = loc;
        return error;
    }
    const errorMessages = {
        // parse errors
        [0 /* ABRUPT_CLOSING_OF_EMPTY_COMMENT */]: 'Illegal comment.',
        [1 /* CDATA_IN_HTML_CONTENT */]: 'CDATA section is allowed only in XML context.',
        [2 /* DUPLICATE_ATTRIBUTE */]: 'Duplicate attribute.',
        [3 /* END_TAG_WITH_ATTRIBUTES */]: 'End tag cannot have attributes.',
        [4 /* END_TAG_WITH_TRAILING_SOLIDUS */]: "Illegal '/' in tags.",
        [5 /* EOF_BEFORE_TAG_NAME */]: 'Unexpected EOF in tag.',
        [6 /* EOF_IN_CDATA */]: 'Unexpected EOF in CDATA section.',
        [7 /* EOF_IN_COMMENT */]: 'Unexpected EOF in comment.',
        [8 /* EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT */]: 'Unexpected EOF in script.',
        [9 /* EOF_IN_TAG */]: 'Unexpected EOF in tag.',
        [10 /* INCORRECTLY_CLOSED_COMMENT */]: 'Incorrectly closed comment.',
        [11 /* INCORRECTLY_OPENED_COMMENT */]: 'Incorrectly opened comment.',
        [12 /* INVALID_FIRST_CHARACTER_OF_TAG_NAME */]: "Illegal tag name. Use '&lt;' to print '<'.",
        [13 /* MISSING_ATTRIBUTE_VALUE */]: 'Attribute value was expected.',
        [14 /* MISSING_END_TAG_NAME */]: 'End tag name was expected.',
        [15 /* MISSING_WHITESPACE_BETWEEN_ATTRIBUTES */]: 'Whitespace was expected.',
        [16 /* NESTED_COMMENT */]: "Unexpected '<!--' in comment.",
        [17 /* UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME */]: 'Attribute name cannot contain U+0022 ("), U+0027 (\'), and U+003C (<).',
        [18 /* UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE */]: 'Unquoted attribute value cannot contain U+0022 ("), U+0027 (\'), U+003C (<), U+003D (=), and U+0060 (`).',
        [19 /* UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME */]: "Attribute name cannot start with '='.",
        [21 /* UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME */]: "'<?' is allowed only in XML context.",
        [22 /* UNEXPECTED_SOLIDUS_IN_TAG */]: "Illegal '/' in tags.",
        // Vue-specific parse errors
        [23 /* X_INVALID_END_TAG */]: 'Invalid end tag.',
        [24 /* X_MISSING_END_TAG */]: 'Element is missing end tag.',
        [25 /* X_MISSING_INTERPOLATION_END */]: 'Interpolation end sign was not found.',
        [26 /* X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END */]: 'End bracket for dynamic directive argument was not found. ' +
            'Note that dynamic directive argument cannot contain spaces.',
        // transform errors
        [27 /* X_V_IF_NO_EXPRESSION */]: `v-if/v-else-if is missing expression.`,
        [28 /* X_V_IF_SAME_KEY */]: `v-if/else branches must use unique keys.`,
        [29 /* X_V_ELSE_NO_ADJACENT_IF */]: `v-else/v-else-if has no adjacent v-if.`,
        [30 /* X_V_FOR_NO_EXPRESSION */]: `v-for is missing expression.`,
        [31 /* X_V_FOR_MALFORMED_EXPRESSION */]: `v-for has invalid expression.`,
        [32 /* X_V_FOR_TEMPLATE_KEY_PLACEMENT */]: `<template v-for> key should be placed on the <template> tag.`,
        [33 /* X_V_BIND_NO_EXPRESSION */]: `v-bind is missing expression.`,
        [34 /* X_V_ON_NO_EXPRESSION */]: `v-on is missing expression.`,
        [35 /* X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET */]: `Unexpected custom directive on <slot> outlet.`,
        [36 /* X_V_SLOT_MIXED_SLOT_USAGE */]: `Mixed v-slot usage on both the component and nested <template>.` +
            `When there are multiple named slots, all slots should use <template> ` +
            `syntax to avoid scope ambiguity.`,
        [37 /* X_V_SLOT_DUPLICATE_SLOT_NAMES */]: `Duplicate slot names found. `,
        [38 /* X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN */]: `Extraneous children found when component already has explicitly named ` +
            `default slot. These children will be ignored.`,
        [39 /* X_V_SLOT_MISPLACED */]: `v-slot can only be used on components or <template> tags.`,
        [40 /* X_V_MODEL_NO_EXPRESSION */]: `v-model is missing expression.`,
        [41 /* X_V_MODEL_MALFORMED_EXPRESSION */]: `v-model value must be a valid JavaScript member expression.`,
        [42 /* X_V_MODEL_ON_SCOPE_VARIABLE */]: `v-model cannot be used on v-for or v-slot scope variables because they are not writable.`,
        [43 /* X_INVALID_EXPRESSION */]: `Error parsing JavaScript expression: `,
        [44 /* X_KEEP_ALIVE_INVALID_CHILDREN */]: `<KeepAlive> expects exactly one child component.`,
        // generic errors
        [45 /* X_PREFIX_ID_NOT_SUPPORTED */]: `"prefixIdentifiers" option is not supported in this build of compiler.`,
        [46 /* X_MODULE_MODE_NOT_SUPPORTED */]: `ES module mode is not supported in this build of compiler.`,
        [47 /* X_CACHE_HANDLER_NOT_SUPPORTED */]: `"cacheHandlers" option is only supported when the "prefixIdentifiers" option is enabled.`,
        [48 /* X_SCOPE_ID_NOT_SUPPORTED */]: `"scopeId" option is only supported in module mode.`
    };

    const FRAGMENT = Symbol(`Fragment`);
    const TELEPORT = Symbol(`Teleport`);
    const SUSPENSE = Symbol(`Suspense`);
    const KEEP_ALIVE = Symbol(`KeepAlive`);
    const BASE_TRANSITION = Symbol(`BaseTransition`);
    const OPEN_BLOCK = Symbol(`openBlock`);
    const CREATE_BLOCK = Symbol(`createBlock`);
    const CREATE_VNODE = Symbol(`createVNode`);
    const CREATE_COMMENT = Symbol(`createCommentVNode`);
    const CREATE_TEXT = Symbol(`createTextVNode`);
    const CREATE_STATIC = Symbol(`createStaticVNode`);
    const RESOLVE_COMPONENT = Symbol(`resolveComponent`);
    const RESOLVE_DYNAMIC_COMPONENT = Symbol(`resolveDynamicComponent`);
    const RESOLVE_DIRECTIVE = Symbol(`resolveDirective`);
    const WITH_DIRECTIVES = Symbol(`withDirectives`);
    const RENDER_LIST = Symbol(`renderList`);
    const RENDER_SLOT = Symbol(`renderSlot`);
    const CREATE_SLOTS = Symbol(`createSlots`);
    const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
    const MERGE_PROPS = Symbol(`mergeProps`);
    const TO_HANDLERS = Symbol(`toHandlers`);
    const CAMELIZE = Symbol(`camelize`);
    const CAPITALIZE = Symbol(`capitalize`);
    const TO_HANDLER_KEY = Symbol(`toHandlerKey`);
    const SET_BLOCK_TRACKING = Symbol(`setBlockTracking`);
    const PUSH_SCOPE_ID = Symbol(`pushScopeId`);
    const POP_SCOPE_ID = Symbol(`popScopeId`);
    const WITH_SCOPE_ID = Symbol(`withScopeId`);
    const WITH_CTX = Symbol(`withCtx`);
    const UNREF = Symbol(`unref`);
    const IS_REF = Symbol(`isRef`);
    // Name mapping for runtime helpers that need to be imported from 'vue' in
    // generated code. Make sure these are correctly exported in the runtime!
    // Using `any` here because TS doesn't allow symbols as index type.
    const helperNameMap = {
        [FRAGMENT]: `Fragment`,
        [TELEPORT]: `Teleport`,
        [SUSPENSE]: `Suspense`,
        [KEEP_ALIVE]: `KeepAlive`,
        [BASE_TRANSITION]: `BaseTransition`,
        [OPEN_BLOCK]: `openBlock`,
        [CREATE_BLOCK]: `createBlock`,
        [CREATE_VNODE]: `createVNode`,
        [CREATE_COMMENT]: `createCommentVNode`,
        [CREATE_TEXT]: `createTextVNode`,
        [CREATE_STATIC]: `createStaticVNode`,
        [RESOLVE_COMPONENT]: `resolveComponent`,
        [RESOLVE_DYNAMIC_COMPONENT]: `resolveDynamicComponent`,
        [RESOLVE_DIRECTIVE]: `resolveDirective`,
        [WITH_DIRECTIVES]: `withDirectives`,
        [RENDER_LIST]: `renderList`,
        [RENDER_SLOT]: `renderSlot`,
        [CREATE_SLOTS]: `createSlots`,
        [TO_DISPLAY_STRING]: `toDisplayString`,
        [MERGE_PROPS]: `mergeProps`,
        [TO_HANDLERS]: `toHandlers`,
        [CAMELIZE]: `camelize`,
        [CAPITALIZE]: `capitalize`,
        [TO_HANDLER_KEY]: `toHandlerKey`,
        [SET_BLOCK_TRACKING]: `setBlockTracking`,
        [PUSH_SCOPE_ID]: `pushScopeId`,
        [POP_SCOPE_ID]: `popScopeId`,
        [WITH_SCOPE_ID]: `withScopeId`,
        [WITH_CTX]: `withCtx`,
        [UNREF]: `unref`,
        [IS_REF]: `isRef`
    };
    function registerRuntimeHelpers(helpers) {
        Object.getOwnPropertySymbols(helpers).forEach(s => {
            helperNameMap[s] = helpers[s];
        });
    }

    // AST Utilities ---------------------------------------------------------------
    // Some expressions, e.g. sequence and conditional expressions, are never
    // associated with template nodes, so their source locations are just a stub.
    // Container types like CompoundExpression also don't need a real location.
    const locStub = {
        source: '',
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 1, offset: 0 }
    };
    function createRoot(children, loc = locStub) {
        return {
            type: 0 /* ROOT */,
            children,
            helpers: [],
            components: [],
            directives: [],
            hoists: [],
            imports: [],
            cached: 0,
            temps: 0,
            codegenNode: undefined,
            loc
        };
    }
    function createVNodeCall(context, tag, props, children, patchFlag, dynamicProps, directives, isBlock = false, disableTracking = false, loc = locStub) {
        if (context) {
            if (isBlock) {
                context.helper(OPEN_BLOCK);
                context.helper(CREATE_BLOCK);
            }
            else {
                context.helper(CREATE_VNODE);
            }
            if (directives) {
                context.helper(WITH_DIRECTIVES);
            }
        }
        return {
            type: 13 /* VNODE_CALL */,
            tag,
            props,
            children,
            patchFlag,
            dynamicProps,
            directives,
            isBlock,
            disableTracking,
            loc
        };
    }
    function createArrayExpression(elements, loc = locStub) {
        return {
            type: 17 /* JS_ARRAY_EXPRESSION */,
            loc,
            elements
        };
    }
    function createObjectExpression(properties, loc = locStub) {
        return {
            type: 15 /* JS_OBJECT_EXPRESSION */,
            loc,
            properties
        };
    }
    function createObjectProperty(key, value) {
        return {
            type: 16 /* JS_PROPERTY */,
            loc: locStub,
            key: isString(key) ? createSimpleExpression(key, true) : key,
            value
        };
    }
    function createSimpleExpression(content, isStatic, loc = locStub, constType = 0 /* NOT_CONSTANT */) {
        return {
            type: 4 /* SIMPLE_EXPRESSION */,
            loc,
            content,
            isStatic,
            constType: isStatic ? 3 /* CAN_STRINGIFY */ : constType
        };
    }
    function createCompoundExpression(children, loc = locStub) {
        return {
            type: 8 /* COMPOUND_EXPRESSION */,
            loc,
            children
        };
    }
    function createCallExpression(callee, args = [], loc = locStub) {
        return {
            type: 14 /* JS_CALL_EXPRESSION */,
            loc,
            callee,
            arguments: args
        };
    }
    function createFunctionExpression(params, returns = undefined, newline = false, isSlot = false, loc = locStub) {
        return {
            type: 18 /* JS_FUNCTION_EXPRESSION */,
            params,
            returns,
            newline,
            isSlot,
            loc
        };
    }
    function createConditionalExpression(test, consequent, alternate, newline = true) {
        return {
            type: 19 /* JS_CONDITIONAL_EXPRESSION */,
            test,
            consequent,
            alternate,
            newline,
            loc: locStub
        };
    }
    function createCacheExpression(index, value, isVNode = false) {
        return {
            type: 20 /* JS_CACHE_EXPRESSION */,
            index,
            value,
            isVNode,
            loc: locStub
        };
    }

    const isStaticExp = (p) => p.type === 4 /* SIMPLE_EXPRESSION */ && p.isStatic;
    const isBuiltInType = (tag, expected) => tag === expected || tag === hyphenate(expected);
    function isCoreComponent(tag) {
        if (isBuiltInType(tag, 'Teleport')) {
            return TELEPORT;
        }
        else if (isBuiltInType(tag, 'Suspense')) {
            return SUSPENSE;
        }
        else if (isBuiltInType(tag, 'KeepAlive')) {
            return KEEP_ALIVE;
        }
        else if (isBuiltInType(tag, 'BaseTransition')) {
            return BASE_TRANSITION;
        }
    }
    const nonIdentifierRE = /^\d|[^\$\w]/;
    const isSimpleIdentifier = (name) => !nonIdentifierRE.test(name);
    const memberExpRE = /^[A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*|\[[^\]]+\])*$/;
    const isMemberExpression = (path) => {
        if (!path)
            return false;
        return memberExpRE.test(path.trim());
    };
    function getInnerRange(loc, offset, length) {
        const source = loc.source.substr(offset, length);
        const newLoc = {
            source,
            start: advancePositionWithClone(loc.start, loc.source, offset),
            end: loc.end
        };
        if (length != null) {
            newLoc.end = advancePositionWithClone(loc.start, loc.source, offset + length);
        }
        return newLoc;
    }
    function advancePositionWithClone(pos, source, numberOfCharacters = source.length) {
        return advancePositionWithMutation(extend({}, pos), source, numberOfCharacters);
    }
    // advance by mutation without cloning (for performance reasons), since this
    // gets called a lot in the parser
    function advancePositionWithMutation(pos, source, numberOfCharacters = source.length) {
        let linesCount = 0;
        let lastNewLinePos = -1;
        for (let i = 0; i < numberOfCharacters; i++) {
            if (source.charCodeAt(i) === 10 /* newline char code */) {
                linesCount++;
                lastNewLinePos = i;
            }
        }
        pos.offset += numberOfCharacters;
        pos.line += linesCount;
        pos.column =
            lastNewLinePos === -1
                ? pos.column + numberOfCharacters
                : numberOfCharacters - lastNewLinePos;
        return pos;
    }
    function assert(condition, msg) {
        /* istanbul ignore if */
        if (!condition) {
            throw new Error(msg || `unexpected compiler condition`);
        }
    }
    function findDir(node, name, allowEmpty = false) {
        for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === 7 /* DIRECTIVE */ &&
                (allowEmpty || p.exp) &&
                (isString(name) ? p.name === name : name.test(p.name))) {
                return p;
            }
        }
    }
    function findProp(node, name, dynamicOnly = false, allowEmpty = false) {
        for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === 6 /* ATTRIBUTE */) {
                if (dynamicOnly)
                    continue;
                if (p.name === name && (p.value || allowEmpty)) {
                    return p;
                }
            }
            else if (p.name === 'bind' &&
                (p.exp || allowEmpty) &&
                isBindKey(p.arg, name)) {
                return p;
            }
        }
    }
    function isBindKey(arg, name) {
        return !!(arg && isStaticExp(arg) && arg.content === name);
    }
    function hasDynamicKeyVBind(node) {
        return node.props.some(p => p.type === 7 /* DIRECTIVE */ &&
            p.name === 'bind' &&
            (!p.arg || // v-bind="obj"
                p.arg.type !== 4 /* SIMPLE_EXPRESSION */ || // v-bind:[_ctx.foo]
                !p.arg.isStatic) // v-bind:[foo]
        );
    }
    function isText(node) {
        return node.type === 5 /* INTERPOLATION */ || node.type === 2 /* TEXT */;
    }
    function isVSlot(p) {
        return p.type === 7 /* DIRECTIVE */ && p.name === 'slot';
    }
    function isTemplateNode(node) {
        return (node.type === 1 /* ELEMENT */ && node.tagType === 3 /* TEMPLATE */);
    }
    function isSlotOutlet(node) {
        return node.type === 1 /* ELEMENT */ && node.tagType === 2 /* SLOT */;
    }
    function injectProp(node, prop, context) {
        let propsWithInjection;
        const props = node.type === 13 /* VNODE_CALL */ ? node.props : node.arguments[2];
        if (props == null || isString(props)) {
            propsWithInjection = createObjectExpression([prop]);
        }
        else if (props.type === 14 /* JS_CALL_EXPRESSION */) {
            // merged props... add ours
            // only inject key to object literal if it's the first argument so that
            // if doesn't override user provided keys
            const first = props.arguments[0];
            if (!isString(first) && first.type === 15 /* JS_OBJECT_EXPRESSION */) {
                first.properties.unshift(prop);
            }
            else {
                if (props.callee === TO_HANDLERS) {
                    // #2366
                    propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
                        createObjectExpression([prop]),
                        props
                    ]);
                }
                else {
                    props.arguments.unshift(createObjectExpression([prop]));
                }
            }
            !propsWithInjection && (propsWithInjection = props);
        }
        else if (props.type === 15 /* JS_OBJECT_EXPRESSION */) {
            let alreadyExists = false;
            // check existing key to avoid overriding user provided keys
            if (prop.key.type === 4 /* SIMPLE_EXPRESSION */) {
                const propKeyName = prop.key.content;
                alreadyExists = props.properties.some(p => p.key.type === 4 /* SIMPLE_EXPRESSION */ &&
                    p.key.content === propKeyName);
            }
            if (!alreadyExists) {
                props.properties.unshift(prop);
            }
            propsWithInjection = props;
        }
        else {
            // single v-bind with expression, return a merged replacement
            propsWithInjection = createCallExpression(context.helper(MERGE_PROPS), [
                createObjectExpression([prop]),
                props
            ]);
        }
        if (node.type === 13 /* VNODE_CALL */) {
            node.props = propsWithInjection;
        }
        else {
            node.arguments[2] = propsWithInjection;
        }
    }
    function toValidAssetId(name, type) {
        return `_${type}_${name.replace(/[^\w]/g, '_')}`;
    }

    // The default decoder only provides escapes for characters reserved as part of
    // the template syntax, and is only used if the custom renderer did not provide
    // a platform-specific decoder.
    const decodeRE = /&(gt|lt|amp|apos|quot);/g;
    const decodeMap = {
        gt: '>',
        lt: '<',
        amp: '&',
        apos: "'",
        quot: '"'
    };
    const defaultParserOptions = {
        delimiters: [`{{`, `}}`],
        getNamespace: () => 0 /* HTML */,
        getTextMode: () => 0 /* DATA */,
        isVoidTag: NO,
        isPreTag: NO,
        isCustomElement: NO,
        decodeEntities: (rawText) => rawText.replace(decodeRE, (_, p1) => decodeMap[p1]),
        onError: defaultOnError,
        comments: false
    };
    function baseParse(content, options = {}) {
        const context = createParserContext(content, options);
        const start = getCursor(context);
        return createRoot(parseChildren(context, 0 /* DATA */, []), getSelection(context, start));
    }
    function createParserContext(content, rawOptions) {
        const options = extend({}, defaultParserOptions);
        for (const key in rawOptions) {
            // @ts-ignore
            options[key] = rawOptions[key] || defaultParserOptions[key];
        }
        return {
            options,
            column: 1,
            line: 1,
            offset: 0,
            originalSource: content,
            source: content,
            inPre: false,
            inVPre: false
        };
    }
    function parseChildren(context, mode, ancestors) {
        const parent = last(ancestors);
        const ns = parent ? parent.ns : 0 /* HTML */;
        const nodes = [];
        while (!isEnd(context, mode, ancestors)) {
            const s = context.source;
            let node = undefined;
            if (mode === 0 /* DATA */ || mode === 1 /* RCDATA */) {
                if (!context.inVPre && startsWith(s, context.options.delimiters[0])) {
                    // '{{'
                    node = parseInterpolation(context, mode);
                }
                else if (mode === 0 /* DATA */ && s[0] === '<') {
                    // https://html.spec.whatwg.org/multipage/parsing.html#tag-open-state
                    if (s.length === 1) {
                        emitError(context, 5 /* EOF_BEFORE_TAG_NAME */, 1);
                    }
                    else if (s[1] === '!') {
                        // https://html.spec.whatwg.org/multipage/parsing.html#markup-declaration-open-state
                        if (startsWith(s, '<!--')) {
                            node = parseComment(context);
                        }
                        else if (startsWith(s, '<!DOCTYPE')) {
                            // Ignore DOCTYPE by a limitation.
                            node = parseBogusComment(context);
                        }
                        else if (startsWith(s, '<![CDATA[')) {
                            if (ns !== 0 /* HTML */) {
                                node = parseCDATA(context, ancestors);
                            }
                            else {
                                emitError(context, 1 /* CDATA_IN_HTML_CONTENT */);
                                node = parseBogusComment(context);
                            }
                        }
                        else {
                            emitError(context, 11 /* INCORRECTLY_OPENED_COMMENT */);
                            node = parseBogusComment(context);
                        }
                    }
                    else if (s[1] === '/') {
                        // https://html.spec.whatwg.org/multipage/parsing.html#end-tag-open-state
                        if (s.length === 2) {
                            emitError(context, 5 /* EOF_BEFORE_TAG_NAME */, 2);
                        }
                        else if (s[2] === '>') {
                            emitError(context, 14 /* MISSING_END_TAG_NAME */, 2);
                            advanceBy(context, 3);
                            continue;
                        }
                        else if (/[a-z]/i.test(s[2])) {
                            emitError(context, 23 /* X_INVALID_END_TAG */);
                            parseTag(context, 1 /* End */, parent);
                            continue;
                        }
                        else {
                            emitError(context, 12 /* INVALID_FIRST_CHARACTER_OF_TAG_NAME */, 2);
                            node = parseBogusComment(context);
                        }
                    }
                    else if (/[a-z]/i.test(s[1])) {
                        node = parseElement(context, ancestors);
                    }
                    else if (s[1] === '?') {
                        emitError(context, 21 /* UNEXPECTED_QUESTION_MARK_INSTEAD_OF_TAG_NAME */, 1);
                        node = parseBogusComment(context);
                    }
                    else {
                        emitError(context, 12 /* INVALID_FIRST_CHARACTER_OF_TAG_NAME */, 1);
                    }
                }
            }
            if (!node) {
                node = parseText(context, mode);
            }
            if (isArray(node)) {
                for (let i = 0; i < node.length; i++) {
                    pushNode(nodes, node[i]);
                }
            }
            else {
                pushNode(nodes, node);
            }
        }
        // Whitespace management for more efficient output
        // (same as v2 whitespace: 'condense')
        let removedWhitespace = false;
        if (mode !== 2 /* RAWTEXT */) {
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                if (!context.inPre && node.type === 2 /* TEXT */) {
                    if (!/[^\t\r\n\f ]/.test(node.content)) {
                        const prev = nodes[i - 1];
                        const next = nodes[i + 1];
                        // If:
                        // - the whitespace is the first or last node, or:
                        // - the whitespace is adjacent to a comment, or:
                        // - the whitespace is between two elements AND contains newline
                        // Then the whitespace is ignored.
                        if (!prev ||
                            !next ||
                            prev.type === 3 /* COMMENT */ ||
                            next.type === 3 /* COMMENT */ ||
                            (prev.type === 1 /* ELEMENT */ &&
                                next.type === 1 /* ELEMENT */ &&
                                /[\r\n]/.test(node.content))) {
                            removedWhitespace = true;
                            nodes[i] = null;
                        }
                        else {
                            // Otherwise, condensed consecutive whitespace inside the text
                            // down to a single space
                            node.content = ' ';
                        }
                    }
                    else {
                        node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ');
                    }
                }
            }
            if (context.inPre && parent && context.options.isPreTag(parent.tag)) {
                // remove leading newline per html spec
                // https://html.spec.whatwg.org/multipage/grouping-content.html#the-pre-element
                const first = nodes[0];
                if (first && first.type === 2 /* TEXT */) {
                    first.content = first.content.replace(/^\r?\n/, '');
                }
            }
        }
        return removedWhitespace ? nodes.filter(Boolean) : nodes;
    }
    function pushNode(nodes, node) {
        if (node.type === 2 /* TEXT */) {
            const prev = last(nodes);
            // Merge if both this and the previous node are text and those are
            // consecutive. This happens for cases like "a < b".
            if (prev &&
                prev.type === 2 /* TEXT */ &&
                prev.loc.end.offset === node.loc.start.offset) {
                prev.content += node.content;
                prev.loc.end = node.loc.end;
                prev.loc.source += node.loc.source;
                return;
            }
        }
        nodes.push(node);
    }
    function parseCDATA(context, ancestors) {
        advanceBy(context, 9);
        const nodes = parseChildren(context, 3 /* CDATA */, ancestors);
        if (context.source.length === 0) {
            emitError(context, 6 /* EOF_IN_CDATA */);
        }
        else {
            advanceBy(context, 3);
        }
        return nodes;
    }
    function parseComment(context) {
        const start = getCursor(context);
        let content;
        // Regular comment.
        const match = /--(\!)?>/.exec(context.source);
        if (!match) {
            content = context.source.slice(4);
            advanceBy(context, context.source.length);
            emitError(context, 7 /* EOF_IN_COMMENT */);
        }
        else {
            if (match.index <= 3) {
                emitError(context, 0 /* ABRUPT_CLOSING_OF_EMPTY_COMMENT */);
            }
            if (match[1]) {
                emitError(context, 10 /* INCORRECTLY_CLOSED_COMMENT */);
            }
            content = context.source.slice(4, match.index);
            // Advancing with reporting nested comments.
            const s = context.source.slice(0, match.index);
            let prevIndex = 1, nestedIndex = 0;
            while ((nestedIndex = s.indexOf('<!--', prevIndex)) !== -1) {
                advanceBy(context, nestedIndex - prevIndex + 1);
                if (nestedIndex + 4 < s.length) {
                    emitError(context, 16 /* NESTED_COMMENT */);
                }
                prevIndex = nestedIndex + 1;
            }
            advanceBy(context, match.index + match[0].length - prevIndex + 1);
        }
        return {
            type: 3 /* COMMENT */,
            content,
            loc: getSelection(context, start)
        };
    }
    function parseBogusComment(context) {
        const start = getCursor(context);
        const contentStart = context.source[1] === '?' ? 1 : 2;
        let content;
        const closeIndex = context.source.indexOf('>');
        if (closeIndex === -1) {
            content = context.source.slice(contentStart);
            advanceBy(context, context.source.length);
        }
        else {
            content = context.source.slice(contentStart, closeIndex);
            advanceBy(context, closeIndex + 1);
        }
        return {
            type: 3 /* COMMENT */,
            content,
            loc: getSelection(context, start)
        };
    }
    function parseElement(context, ancestors) {
        // Start tag.
        const wasInPre = context.inPre;
        const wasInVPre = context.inVPre;
        const parent = last(ancestors);
        const element = parseTag(context, 0 /* Start */, parent);
        const isPreBoundary = context.inPre && !wasInPre;
        const isVPreBoundary = context.inVPre && !wasInVPre;
        if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
            return element;
        }
        // Children.
        ancestors.push(element);
        const mode = context.options.getTextMode(element, parent);
        const children = parseChildren(context, mode, ancestors);
        ancestors.pop();
        element.children = children;
        // End tag.
        if (startsWithEndTagOpen(context.source, element.tag)) {
            parseTag(context, 1 /* End */, parent);
        }
        else {
            emitError(context, 24 /* X_MISSING_END_TAG */, 0, element.loc.start);
            if (context.source.length === 0 && element.tag.toLowerCase() === 'script') {
                const first = children[0];
                if (first && startsWith(first.loc.source, '<!--')) {
                    emitError(context, 8 /* EOF_IN_SCRIPT_HTML_COMMENT_LIKE_TEXT */);
                }
            }
        }
        element.loc = getSelection(context, element.loc.start);
        if (isPreBoundary) {
            context.inPre = false;
        }
        if (isVPreBoundary) {
            context.inVPre = false;
        }
        return element;
    }
    const isSpecialTemplateDirective = /*#__PURE__*/ makeMap(`if,else,else-if,for,slot`);
    /**
     * Parse a tag (E.g. `<div id=a>`) with that type (start tag or end tag).
     */
    function parseTag(context, type, parent) {
        // Tag open.
        const start = getCursor(context);
        const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
        const tag = match[1];
        const ns = context.options.getNamespace(tag, parent);
        advanceBy(context, match[0].length);
        advanceSpaces(context);
        // save current state in case we need to re-parse attributes with v-pre
        const cursor = getCursor(context);
        const currentSource = context.source;
        // Attributes.
        let props = parseAttributes(context, type);
        // check <pre> tag
        if (context.options.isPreTag(tag)) {
            context.inPre = true;
        }
        // check v-pre
        if (!context.inVPre &&
            props.some(p => p.type === 7 /* DIRECTIVE */ && p.name === 'pre')) {
            context.inVPre = true;
            // reset context
            extend(context, cursor);
            context.source = currentSource;
            // re-parse attrs and filter out v-pre itself
            props = parseAttributes(context, type).filter(p => p.name !== 'v-pre');
        }
        // Tag close.
        let isSelfClosing = false;
        if (context.source.length === 0) {
            emitError(context, 9 /* EOF_IN_TAG */);
        }
        else {
            isSelfClosing = startsWith(context.source, '/>');
            if (type === 1 /* End */ && isSelfClosing) {
                emitError(context, 4 /* END_TAG_WITH_TRAILING_SOLIDUS */);
            }
            advanceBy(context, isSelfClosing ? 2 : 1);
        }
        let tagType = 0 /* ELEMENT */;
        const options = context.options;
        if (!context.inVPre && !options.isCustomElement(tag)) {
            const hasVIs = props.some(p => p.type === 7 /* DIRECTIVE */ && p.name === 'is');
            if (options.isNativeTag && !hasVIs) {
                if (!options.isNativeTag(tag))
                    tagType = 1 /* COMPONENT */;
            }
            else if (hasVIs ||
                isCoreComponent(tag) ||
                (options.isBuiltInComponent && options.isBuiltInComponent(tag)) ||
                /^[A-Z]/.test(tag) ||
                tag === 'component') {
                tagType = 1 /* COMPONENT */;
            }
            if (tag === 'slot') {
                tagType = 2 /* SLOT */;
            }
            else if (tag === 'template' &&
                props.some(p => {
                    return (p.type === 7 /* DIRECTIVE */ && isSpecialTemplateDirective(p.name));
                })) {
                tagType = 3 /* TEMPLATE */;
            }
        }
        return {
            type: 1 /* ELEMENT */,
            ns,
            tag,
            tagType,
            props,
            isSelfClosing,
            children: [],
            loc: getSelection(context, start),
            codegenNode: undefined // to be created during transform phase
        };
    }
    function parseAttributes(context, type) {
        const props = [];
        const attributeNames = new Set();
        while (context.source.length > 0 &&
            !startsWith(context.source, '>') &&
            !startsWith(context.source, '/>')) {
            if (startsWith(context.source, '/')) {
                emitError(context, 22 /* UNEXPECTED_SOLIDUS_IN_TAG */);
                advanceBy(context, 1);
                advanceSpaces(context);
                continue;
            }
            if (type === 1 /* End */) {
                emitError(context, 3 /* END_TAG_WITH_ATTRIBUTES */);
            }
            const attr = parseAttribute(context, attributeNames);
            if (type === 0 /* Start */) {
                props.push(attr);
            }
            if (/^[^\t\r\n\f />]/.test(context.source)) {
                emitError(context, 15 /* MISSING_WHITESPACE_BETWEEN_ATTRIBUTES */);
            }
            advanceSpaces(context);
        }
        return props;
    }
    function parseAttribute(context, nameSet) {
        // Name.
        const start = getCursor(context);
        const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source);
        const name = match[0];
        if (nameSet.has(name)) {
            emitError(context, 2 /* DUPLICATE_ATTRIBUTE */);
        }
        nameSet.add(name);
        if (name[0] === '=') {
            emitError(context, 19 /* UNEXPECTED_EQUALS_SIGN_BEFORE_ATTRIBUTE_NAME */);
        }
        {
            const pattern = /["'<]/g;
            let m;
            while ((m = pattern.exec(name))) {
                emitError(context, 17 /* UNEXPECTED_CHARACTER_IN_ATTRIBUTE_NAME */, m.index);
            }
        }
        advanceBy(context, name.length);
        // Value
        let value = undefined;
        if (/^[\t\r\n\f ]*=/.test(context.source)) {
            advanceSpaces(context);
            advanceBy(context, 1);
            advanceSpaces(context);
            value = parseAttributeValue(context);
            if (!value) {
                emitError(context, 13 /* MISSING_ATTRIBUTE_VALUE */);
            }
        }
        const loc = getSelection(context, start);
        if (!context.inVPre && /^(v-|:|@|#)/.test(name)) {
            const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(name);
            const dirName = match[1] ||
                (startsWith(name, ':') ? 'bind' : startsWith(name, '@') ? 'on' : 'slot');
            let arg;
            if (match[2]) {
                const isSlot = dirName === 'slot';
                const startOffset = name.indexOf(match[2]);
                const loc = getSelection(context, getNewPosition(context, start, startOffset), getNewPosition(context, start, startOffset + match[2].length + ((isSlot && match[3]) || '').length));
                let content = match[2];
                let isStatic = true;
                if (content.startsWith('[')) {
                    isStatic = false;
                    if (!content.endsWith(']')) {
                        emitError(context, 26 /* X_MISSING_DYNAMIC_DIRECTIVE_ARGUMENT_END */);
                    }
                    content = content.substr(1, content.length - 2);
                }
                else if (isSlot) {
                    // #1241 special case for v-slot: vuetify relies extensively on slot
                    // names containing dots. v-slot doesn't have any modifiers and Vue 2.x
                    // supports such usage so we are keeping it consistent with 2.x.
                    content += match[3] || '';
                }
                arg = {
                    type: 4 /* SIMPLE_EXPRESSION */,
                    content,
                    isStatic,
                    constType: isStatic
                        ? 3 /* CAN_STRINGIFY */
                        : 0 /* NOT_CONSTANT */,
                    loc
                };
            }
            if (value && value.isQuoted) {
                const valueLoc = value.loc;
                valueLoc.start.offset++;
                valueLoc.start.column++;
                valueLoc.end = advancePositionWithClone(valueLoc.start, value.content);
                valueLoc.source = valueLoc.source.slice(1, -1);
            }
            return {
                type: 7 /* DIRECTIVE */,
                name: dirName,
                exp: value && {
                    type: 4 /* SIMPLE_EXPRESSION */,
                    content: value.content,
                    isStatic: false,
                    // Treat as non-constant by default. This can be potentially set to
                    // other values by `transformExpression` to make it eligible for hoisting.
                    constType: 0 /* NOT_CONSTANT */,
                    loc: value.loc
                },
                arg,
                modifiers: match[3] ? match[3].substr(1).split('.') : [],
                loc
            };
        }
        return {
            type: 6 /* ATTRIBUTE */,
            name,
            value: value && {
                type: 2 /* TEXT */,
                content: value.content,
                loc: value.loc
            },
            loc
        };
    }
    function parseAttributeValue(context) {
        const start = getCursor(context);
        let content;
        const quote = context.source[0];
        const isQuoted = quote === `"` || quote === `'`;
        if (isQuoted) {
            // Quoted value.
            advanceBy(context, 1);
            const endIndex = context.source.indexOf(quote);
            if (endIndex === -1) {
                content = parseTextData(context, context.source.length, 4 /* ATTRIBUTE_VALUE */);
            }
            else {
                content = parseTextData(context, endIndex, 4 /* ATTRIBUTE_VALUE */);
                advanceBy(context, 1);
            }
        }
        else {
            // Unquoted
            const match = /^[^\t\r\n\f >]+/.exec(context.source);
            if (!match) {
                return undefined;
            }
            const unexpectedChars = /["'<=`]/g;
            let m;
            while ((m = unexpectedChars.exec(match[0]))) {
                emitError(context, 18 /* UNEXPECTED_CHARACTER_IN_UNQUOTED_ATTRIBUTE_VALUE */, m.index);
            }
            content = parseTextData(context, match[0].length, 4 /* ATTRIBUTE_VALUE */);
        }
        return { content, isQuoted, loc: getSelection(context, start) };
    }
    function parseInterpolation(context, mode) {
        const [open, close] = context.options.delimiters;
        const closeIndex = context.source.indexOf(close, open.length);
        if (closeIndex === -1) {
            emitError(context, 25 /* X_MISSING_INTERPOLATION_END */);
            return undefined;
        }
        const start = getCursor(context);
        advanceBy(context, open.length);
        const innerStart = getCursor(context);
        const innerEnd = getCursor(context);
        const rawContentLength = closeIndex - open.length;
        const rawContent = context.source.slice(0, rawContentLength);
        const preTrimContent = parseTextData(context, rawContentLength, mode);
        const content = preTrimContent.trim();
        const startOffset = preTrimContent.indexOf(content);
        if (startOffset > 0) {
            advancePositionWithMutation(innerStart, rawContent, startOffset);
        }
        const endOffset = rawContentLength - (preTrimContent.length - content.length - startOffset);
        advancePositionWithMutation(innerEnd, rawContent, endOffset);
        advanceBy(context, close.length);
        return {
            type: 5 /* INTERPOLATION */,
            content: {
                type: 4 /* SIMPLE_EXPRESSION */,
                isStatic: false,
                // Set `isConstant` to false by default and will decide in transformExpression
                constType: 0 /* NOT_CONSTANT */,
                content,
                loc: getSelection(context, innerStart, innerEnd)
            },
            loc: getSelection(context, start)
        };
    }
    function parseText(context, mode) {
        const endTokens = ['<', context.options.delimiters[0]];
        if (mode === 3 /* CDATA */) {
            endTokens.push(']]>');
        }
        let endIndex = context.source.length;
        for (let i = 0; i < endTokens.length; i++) {
            const index = context.source.indexOf(endTokens[i], 1);
            if (index !== -1 && endIndex > index) {
                endIndex = index;
            }
        }
        const start = getCursor(context);
        const content = parseTextData(context, endIndex, mode);
        return {
            type: 2 /* TEXT */,
            content,
            loc: getSelection(context, start)
        };
    }
    /**
     * Get text data with a given length from the current location.
     * This translates HTML entities in the text data.
     */
    function parseTextData(context, length, mode) {
        const rawText = context.source.slice(0, length);
        advanceBy(context, length);
        if (mode === 2 /* RAWTEXT */ ||
            mode === 3 /* CDATA */ ||
            rawText.indexOf('&') === -1) {
            return rawText;
        }
        else {
            // DATA or RCDATA containing "&"". Entity decoding required.
            return context.options.decodeEntities(rawText, mode === 4 /* ATTRIBUTE_VALUE */);
        }
    }
    function getCursor(context) {
        const { column, line, offset } = context;
        return { column, line, offset };
    }
    function getSelection(context, start, end) {
        end = end || getCursor(context);
        return {
            start,
            end,
            source: context.originalSource.slice(start.offset, end.offset)
        };
    }
    function last(xs) {
        return xs[xs.length - 1];
    }
    function startsWith(source, searchString) {
        return source.startsWith(searchString);
    }
    function advanceBy(context, numberOfCharacters) {
        const { source } = context;
        advancePositionWithMutation(context, source, numberOfCharacters);
        context.source = source.slice(numberOfCharacters);
    }
    function advanceSpaces(context) {
        const match = /^[\t\r\n\f ]+/.exec(context.source);
        if (match) {
            advanceBy(context, match[0].length);
        }
    }
    function getNewPosition(context, start, numberOfCharacters) {
        return advancePositionWithClone(start, context.originalSource.slice(start.offset, numberOfCharacters), numberOfCharacters);
    }
    function emitError(context, code, offset, loc = getCursor(context)) {
        if (offset) {
            loc.offset += offset;
            loc.column += offset;
        }
        context.options.onError(createCompilerError(code, {
            start: loc,
            end: loc,
            source: ''
        }));
    }
    function isEnd(context, mode, ancestors) {
        const s = context.source;
        switch (mode) {
            case 0 /* DATA */:
                if (startsWith(s, '</')) {
                    // TODO: probably bad performance
                    for (let i = ancestors.length - 1; i >= 0; --i) {
                        if (startsWithEndTagOpen(s, ancestors[i].tag)) {
                            return true;
                        }
                    }
                }
                break;
            case 1 /* RCDATA */:
            case 2 /* RAWTEXT */: {
                const parent = last(ancestors);
                if (parent && startsWithEndTagOpen(s, parent.tag)) {
                    return true;
                }
                break;
            }
            case 3 /* CDATA */:
                if (startsWith(s, ']]>')) {
                    return true;
                }
                break;
        }
        return !s;
    }
    function startsWithEndTagOpen(source, tag) {
        return (startsWith(source, '</') &&
            source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
            /[\t\r\n\f />]/.test(source[2 + tag.length] || '>'));
    }

    function hoistStatic(root, context) {
        walk(root, context,
            // Root node is unfortunately non-hoistable due to potential parent
            // fallthrough attributes.
            isSingleElementRoot(root, root.children[0]));
    }
    function isSingleElementRoot(root, child) {
        const { children } = root;
        return (children.length === 1 &&
            child.type === 1 /* ELEMENT */ &&
            !isSlotOutlet(child));
    }
    function walk(node, context, doNotHoistNode = false) {
        let hasHoistedNode = false;
        // Some transforms, e.g. transformAssetUrls from @vue/compiler-sfc, replaces
        // static bindings with expressions. These expressions are guaranteed to be
        // constant so they are still eligible for hoisting, but they are only
        // available at runtime and therefore cannot be evaluated ahead of time.
        // This is only a concern for pre-stringification (via transformHoist by
        // @vue/compiler-dom), but doing it here allows us to perform only one full
        // walk of the AST and allow `stringifyStatic` to stop walking as soon as its
        // stringficiation threshold is met.
        let canStringify = true;
        const { children } = node;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            // only plain elements & text calls are eligible for hoisting.
            if (child.type === 1 /* ELEMENT */ &&
                child.tagType === 0 /* ELEMENT */) {
                const constantType = doNotHoistNode
                    ? 0 /* NOT_CONSTANT */
                    : getConstantType(child, context);
                if (constantType > 0 /* NOT_CONSTANT */) {
                    if (constantType < 3 /* CAN_STRINGIFY */) {
                        canStringify = false;
                    }
                    if (constantType >= 2 /* CAN_HOIST */) {
                        child.codegenNode.patchFlag =
                            -1 /* HOISTED */ + (` /* HOISTED */`);
                        child.codegenNode = context.hoist(child.codegenNode);
                        hasHoistedNode = true;
                        continue;
                    }
                }
                else {
                    // node may contain dynamic children, but its props may be eligible for
                    // hoisting.
                    const codegenNode = child.codegenNode;
                    if (codegenNode.type === 13 /* VNODE_CALL */) {
                        const flag = getPatchFlag(codegenNode);
                        if ((!flag ||
                            flag === 512 /* NEED_PATCH */ ||
                            flag === 1 /* TEXT */) &&
                            getGeneratedPropsConstantType(child, context) >=
                            2 /* CAN_HOIST */) {
                            const props = getNodeProps(child);
                            if (props) {
                                codegenNode.props = context.hoist(props);
                            }
                        }
                    }
                }
            }
            else if (child.type === 12 /* TEXT_CALL */) {
                const contentType = getConstantType(child.content, context);
                if (contentType > 0) {
                    if (contentType < 3 /* CAN_STRINGIFY */) {
                        canStringify = false;
                    }
                    if (contentType >= 2 /* CAN_HOIST */) {
                        child.codegenNode = context.hoist(child.codegenNode);
                        hasHoistedNode = true;
                    }
                }
            }
            // walk further
            if (child.type === 1 /* ELEMENT */) {
                walk(child, context);
            }
            else if (child.type === 11 /* FOR */) {
                // Do not hoist v-for single child because it has to be a block
                walk(child, context, child.children.length === 1);
            }
            else if (child.type === 9 /* IF */) {
                for (let i = 0; i < child.branches.length; i++) {
                    // Do not hoist v-if single child because it has to be a block
                    walk(child.branches[i], context, child.branches[i].children.length === 1);
                }
            }
        }
        if (canStringify && hasHoistedNode && context.transformHoist) {
            context.transformHoist(children, context, node);
        }
    }
    function getConstantType(node, context) {
        const { constantCache } = context;
        switch (node.type) {
            case 1 /* ELEMENT */:
                if (node.tagType !== 0 /* ELEMENT */) {
                    return 0 /* NOT_CONSTANT */;
                }
                const cached = constantCache.get(node);
                if (cached !== undefined) {
                    return cached;
                }
                const codegenNode = node.codegenNode;
                if (codegenNode.type !== 13 /* VNODE_CALL */) {
                    return 0 /* NOT_CONSTANT */;
                }
                const flag = getPatchFlag(codegenNode);
                if (!flag) {
                    let returnType = 3 /* CAN_STRINGIFY */;
                    // Element itself has no patch flag. However we still need to check:
                    // 1. Even for a node with no patch flag, it is possible for it to contain
                    // non-hoistable expressions that refers to scope variables, e.g. compiler
                    // injected keys or cached event handlers. Therefore we need to always
                    // check the codegenNode's props to be sure.
                    const generatedPropsType = getGeneratedPropsConstantType(node, context);
                    if (generatedPropsType === 0 /* NOT_CONSTANT */) {
                        constantCache.set(node, 0 /* NOT_CONSTANT */);
                        return 0 /* NOT_CONSTANT */;
                    }
                    if (generatedPropsType < returnType) {
                        returnType = generatedPropsType;
                    }
                    // 2. its children.
                    for (let i = 0; i < node.children.length; i++) {
                        const childType = getConstantType(node.children[i], context);
                        if (childType === 0 /* NOT_CONSTANT */) {
                            constantCache.set(node, 0 /* NOT_CONSTANT */);
                            return 0 /* NOT_CONSTANT */;
                        }
                        if (childType < returnType) {
                            returnType = childType;
                        }
                    }
                    // 3. if the type is not already CAN_SKIP_PATCH which is the lowest non-0
                    // type, check if any of the props can cause the type to be lowered
                    // we can skip can_patch because it's guaranteed by the absence of a
                    // patchFlag.
                    if (returnType > 1 /* CAN_SKIP_PATCH */) {
                        for (let i = 0; i < node.props.length; i++) {
                            const p = node.props[i];
                            if (p.type === 7 /* DIRECTIVE */ && p.name === 'bind' && p.exp) {
                                const expType = getConstantType(p.exp, context);
                                if (expType === 0 /* NOT_CONSTANT */) {
                                    constantCache.set(node, 0 /* NOT_CONSTANT */);
                                    return 0 /* NOT_CONSTANT */;
                                }
                                if (expType < returnType) {
                                    returnType = expType;
                                }
                            }
                        }
                    }
                    // only svg/foreignObject could be block here, however if they are
                    // static then they don't need to be blocks since there will be no
                    // nested updates.
                    if (codegenNode.isBlock) {
                        codegenNode.isBlock = false;
                        context.helper(CREATE_VNODE);
                    }
                    constantCache.set(node, returnType);
                    return returnType;
                }
                else {
                    constantCache.set(node, 0 /* NOT_CONSTANT */);
                    return 0 /* NOT_CONSTANT */;
                }
            case 2 /* TEXT */:
            case 3 /* COMMENT */:
                return 3 /* CAN_STRINGIFY */;
            case 9 /* IF */:
            case 11 /* FOR */:
            case 10 /* IF_BRANCH */:
                return 0 /* NOT_CONSTANT */;
            case 5 /* INTERPOLATION */:
            case 12 /* TEXT_CALL */:
                return getConstantType(node.content, context);
            case 4 /* SIMPLE_EXPRESSION */:
                return node.constType;
            case 8 /* COMPOUND_EXPRESSION */:
                let returnType = 3 /* CAN_STRINGIFY */;
                for (let i = 0; i < node.children.length; i++) {
                    const child = node.children[i];
                    if (isString(child) || isSymbol(child)) {
                        continue;
                    }
                    const childType = getConstantType(child, context);
                    if (childType === 0 /* NOT_CONSTANT */) {
                        return 0 /* NOT_CONSTANT */;
                    }
                    else if (childType < returnType) {
                        returnType = childType;
                    }
                }
                return returnType;
            default:
                return 0 /* NOT_CONSTANT */;
        }
    }
    function getGeneratedPropsConstantType(node, context) {
        let returnType = 3 /* CAN_STRINGIFY */;
        const props = getNodeProps(node);
        if (props && props.type === 15 /* JS_OBJECT_EXPRESSION */) {
            const { properties } = props;
            for (let i = 0; i < properties.length; i++) {
                const { key, value } = properties[i];
                const keyType = getConstantType(key, context);
                if (keyType === 0 /* NOT_CONSTANT */) {
                    return keyType;
                }
                if (keyType < returnType) {
                    returnType = keyType;
                }
                if (value.type !== 4 /* SIMPLE_EXPRESSION */) {
                    return 0 /* NOT_CONSTANT */;
                }
                const valueType = getConstantType(value, context);
                if (valueType === 0 /* NOT_CONSTANT */) {
                    return valueType;
                }
                if (valueType < returnType) {
                    returnType = valueType;
                }
            }
        }
        return returnType;
    }
    function getNodeProps(node) {
        const codegenNode = node.codegenNode;
        if (codegenNode.type === 13 /* VNODE_CALL */) {
            return codegenNode.props;
        }
    }
    function getPatchFlag(node) {
        const flag = node.patchFlag;
        return flag ? parseInt(flag, 10) : undefined;
    }

    function createTransformContext(root, { filename = '', prefixIdentifiers = false, hoistStatic = false, cacheHandlers = false, nodeTransforms = [], directiveTransforms = {}, transformHoist = null, isBuiltInComponent = NOOP, isCustomElement = NOOP, expressionPlugins = [], scopeId = null, ssr = false, ssrCssVars = ``, bindingMetadata = EMPTY_OBJ, inline = false, isTS = false, onError = defaultOnError }) {
        const nameMatch = filename.replace(/\?.*$/, '').match(/([^/\\]+)\.\w+$/);
        const context = {
            // options
            selfName: nameMatch && capitalize(camelize(nameMatch[1])),
            prefixIdentifiers,
            hoistStatic,
            cacheHandlers,
            nodeTransforms,
            directiveTransforms,
            transformHoist,
            isBuiltInComponent,
            isCustomElement,
            expressionPlugins,
            scopeId,
            ssr,
            ssrCssVars,
            bindingMetadata,
            inline,
            isTS,
            onError,
            // state
            root,
            helpers: new Set(),
            components: new Set(),
            directives: new Set(),
            hoists: [],
            imports: [],
            constantCache: new Map(),
            temps: 0,
            cached: 0,
            identifiers: Object.create(null),
            scopes: {
                vFor: 0,
                vSlot: 0,
                vPre: 0,
                vOnce: 0
            },
            parent: null,
            currentNode: root,
            childIndex: 0,
            // methods
            helper(name) {
                context.helpers.add(name);
                return name;
            },
            helperString(name) {
                return `_${helperNameMap[context.helper(name)]}`;
            },
            replaceNode(node) {
                /* istanbul ignore if */
                {
                    if (!context.currentNode) {
                        throw new Error(`Node being replaced is already removed.`);
                    }
                    if (!context.parent) {
                        throw new Error(`Cannot replace root node.`);
                    }
                }
                context.parent.children[context.childIndex] = context.currentNode = node;
            },
            removeNode(node) {
                if (!context.parent) {
                    throw new Error(`Cannot remove root node.`);
                }
                const list = context.parent.children;
                const removalIndex = node
                    ? list.indexOf(node)
                    : context.currentNode
                        ? context.childIndex
                        : -1;
                /* istanbul ignore if */
                if (removalIndex < 0) {
                    throw new Error(`node being removed is not a child of current parent`);
                }
                if (!node || node === context.currentNode) {
                    // current node removed
                    context.currentNode = null;
                    context.onNodeRemoved();
                }
                else {
                    // sibling node removed
                    if (context.childIndex > removalIndex) {
                        context.childIndex--;
                        context.onNodeRemoved();
                    }
                }
                context.parent.children.splice(removalIndex, 1);
            },
            onNodeRemoved: () => { },
            addIdentifiers(exp) {
            },
            removeIdentifiers(exp) {
            },
            hoist(exp) {
                context.hoists.push(exp);
                const identifier = createSimpleExpression(`_hoisted_${context.hoists.length}`, false, exp.loc, 2 /* CAN_HOIST */);
                identifier.hoisted = exp;
                return identifier;
            },
            cache(exp, isVNode = false) {
                return createCacheExpression(++context.cached, exp, isVNode);
            }
        };
        return context;
    }
    function transform(root, options) {
        const context = createTransformContext(root, options);
        traverseNode(root, context);
        if (options.hoistStatic) {
            hoistStatic(root, context);
        }
        if (!options.ssr) {
            createRootCodegen(root, context);
        }
        // finalize meta information
        root.helpers = [...context.helpers];
        root.components = [...context.components];
        root.directives = [...context.directives];
        root.imports = context.imports;
        root.hoists = context.hoists;
        root.temps = context.temps;
        root.cached = context.cached;
    }
    function createRootCodegen(root, context) {
        const { helper } = context;
        const { children } = root;
        if (children.length === 1) {
            const child = children[0];
            // if the single child is an element, turn it into a block.
            if (isSingleElementRoot(root, child) && child.codegenNode) {
                // single element root is never hoisted so codegenNode will never be
                // SimpleExpressionNode
                const codegenNode = child.codegenNode;
                if (codegenNode.type === 13 /* VNODE_CALL */) {
                    codegenNode.isBlock = true;
                    helper(OPEN_BLOCK);
                    helper(CREATE_BLOCK);
                }
                root.codegenNode = codegenNode;
            }
            else {
                // - single <slot/>, IfNode, ForNode: already blocks.
                // - single text node: always patched.
                // root codegen falls through via genNode()
                root.codegenNode = child;
            }
        }
        else if (children.length > 1) {
            // root has multiple nodes - return a fragment block.
            let patchFlag = 64 /* STABLE_FRAGMENT */;
            let patchFlagText = PatchFlagNames[64 /* STABLE_FRAGMENT */];
            // check if the fragment actually contains a single valid child with
            // the rest being comments
            if (children.filter(c => c.type !== 3 /* COMMENT */).length === 1) {
                patchFlag |= 2048 /* DEV_ROOT_FRAGMENT */;
                patchFlagText += `, ${PatchFlagNames[2048 /* DEV_ROOT_FRAGMENT */]}`;
            }
            root.codegenNode = createVNodeCall(context, helper(FRAGMENT), undefined, root.children, patchFlag + (` /* ${patchFlagText} */`), undefined, undefined, true);
        }
        else;
    }
    function traverseChildren(parent, context) {
        let i = 0;
        const nodeRemoved = () => {
            i--;
        };
        for (; i < parent.children.length; i++) {
            const child = parent.children[i];
            if (isString(child))
                continue;
            context.parent = parent;
            context.childIndex = i;
            context.onNodeRemoved = nodeRemoved;
            traverseNode(child, context);
        }
    }
    function traverseNode(node, context) {
        context.currentNode = node;
        // apply transform plugins
        const { nodeTransforms } = context;
        const exitFns = [];
        for (let i = 0; i < nodeTransforms.length; i++) {
            const onExit = nodeTransforms[i](node, context);
            if (onExit) {
                if (isArray(onExit)) {
                    exitFns.push(...onExit);
                }
                else {
                    exitFns.push(onExit);
                }
            }
            if (!context.currentNode) {
                // node was removed
                return;
            }
            else {
                // node may have been replaced
                node = context.currentNode;
            }
        }
        switch (node.type) {
            case 3 /* COMMENT */:
                if (!context.ssr) {
                    // inject import for the Comment symbol, which is needed for creating
                    // comment nodes with `createVNode`
                    context.helper(CREATE_COMMENT);
                }
                break;
            case 5 /* INTERPOLATION */:
                // no need to traverse, but we need to inject toString helper
                if (!context.ssr) {
                    context.helper(TO_DISPLAY_STRING);
                }
                break;
            // for container types, further traverse downwards
            case 9 /* IF */:
                for (let i = 0; i < node.branches.length; i++) {
                    traverseNode(node.branches[i], context);
                }
                break;
            case 10 /* IF_BRANCH */:
            case 11 /* FOR */:
            case 1 /* ELEMENT */:
            case 0 /* ROOT */:
                traverseChildren(node, context);
                break;
        }
        // exit transforms
        context.currentNode = node;
        let i = exitFns.length;
        while (i--) {
            exitFns[i]();
        }
    }
    function createStructuralDirectiveTransform(name, fn) {
        const matches = isString(name)
            ? (n) => n === name
            : (n) => name.test(n);
        return (node, context) => {
            if (node.type === 1 /* ELEMENT */) {
                const { props } = node;
                // structural directive transforms are not concerned with slots
                // as they are handled separately in vSlot.ts
                if (node.tagType === 3 /* TEMPLATE */ && props.some(isVSlot)) {
                    return;
                }
                const exitFns = [];
                for (let i = 0; i < props.length; i++) {
                    const prop = props[i];
                    if (prop.type === 7 /* DIRECTIVE */ && matches(prop.name)) {
                        // structural directives are removed to avoid infinite recursion
                        // also we remove them *before* applying so that it can further
                        // traverse itself in case it moves the node around
                        props.splice(i, 1);
                        i--;
                        const onExit = fn(node, prop, context);
                        if (onExit)
                            exitFns.push(onExit);
                    }
                }
                return exitFns;
            }
        };
    }

    const PURE_ANNOTATION = `/*#__PURE__*/`;
    function createCodegenContext(ast, { mode = 'function', prefixIdentifiers = mode === 'module', sourceMap = false, filename = `template.vue.html`, scopeId = null, optimizeImports = false, runtimeGlobalName = `Vue`, runtimeModuleName = `vue`, ssr = false }) {
        const context = {
            mode,
            prefixIdentifiers,
            sourceMap,
            filename,
            scopeId,
            optimizeImports,
            runtimeGlobalName,
            runtimeModuleName,
            ssr,
            source: ast.loc.source,
            code: ``,
            column: 1,
            line: 1,
            offset: 0,
            indentLevel: 0,
            pure: false,
            map: undefined,
            helper(key) {
                return `_${helperNameMap[key]}`;
            },
            push(code, node) {
                context.code += code;
            },
            indent() {
                newline(++context.indentLevel);
            },
            deindent(withoutNewLine = false) {
                if (withoutNewLine) {
                    --context.indentLevel;
                }
                else {
                    newline(--context.indentLevel);
                }
            },
            newline() {
                newline(context.indentLevel);
            }
        };
        function newline(n) {
            context.push('\n' + `  `.repeat(n));
        }
        return context;
    }
    function generate(ast, options = {}) {
        const context = createCodegenContext(ast, options);
        if (options.onContextCreated)
            options.onContextCreated(context);
        const { mode, push, prefixIdentifiers, indent, deindent, newline, scopeId, ssr } = context;
        const hasHelpers = ast.helpers.length > 0;
        const useWithBlock = !prefixIdentifiers && mode !== 'module';
        // preambles
        // in setup() inline mode, the preamble is generated in a sub context
        // and returned separately.
        const preambleContext = context;
        {
            genFunctionPreamble(ast, preambleContext);
        }
        // enter render function
        const functionName = ssr ? `ssrRender` : `render`;
        const args = ssr ? ['_ctx', '_push', '_parent', '_attrs'] : ['_ctx', '_cache'];
        const signature = args.join(', ');
        {
            push(`function ${functionName}(${signature}) {`);
        }
        indent();
        if (useWithBlock) {
            push(`with (_ctx) {`);
            indent();
            // function mode const declarations should be inside with block
            // also they should be renamed to avoid collision with user properties
            if (hasHelpers) {
                push(`const { ${ast.helpers
                    .map(s => `${helperNameMap[s]}: _${helperNameMap[s]}`)
                    .join(', ')} } = _Vue`);
                push(`\n`);
                newline();
            }
        }
        // generate asset resolution statements
        if (ast.components.length) {
            genAssets(ast.components, 'component', context);
            if (ast.directives.length || ast.temps > 0) {
                newline();
            }
        }
        if (ast.directives.length) {
            genAssets(ast.directives, 'directive', context);
            if (ast.temps > 0) {
                newline();
            }
        }
        if (ast.temps > 0) {
            push(`let `);
            for (let i = 0; i < ast.temps; i++) {
                push(`${i > 0 ? `, ` : ``}_temp${i}`);
            }
        }
        if (ast.components.length || ast.directives.length || ast.temps) {
            push(`\n`);
            newline();
        }
        // generate the VNode tree expression
        if (!ssr) {
            push(`return `);
        }
        if (ast.codegenNode) {
            genNode(ast.codegenNode, context);
        }
        else {
            push(`null`);
        }
        if (useWithBlock) {
            deindent();
            push(`}`);
        }
        deindent();
        push(`}`);
        return {
            ast,
            code: context.code,
            preamble: ``,
            // SourceMapGenerator does have toJSON() method but it's not in the types
            map: context.map ? context.map.toJSON() : undefined
        };
    }
    function genFunctionPreamble(ast, context) {
        const { ssr, prefixIdentifiers, push, newline, runtimeModuleName, runtimeGlobalName } = context;
        const VueBinding = runtimeGlobalName;
        const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;
        // Generate const declaration for helpers
        // In prefix mode, we place the const declaration at top so it's done
        // only once; But if we not prefixing, we place the declaration inside the
        // with block so it doesn't incur the `in` check cost for every helper access.
        if (ast.helpers.length > 0) {
            {
                // "with" mode.
                // save Vue in a separate variable to avoid collision
                push(`const _Vue = ${VueBinding}\n`);
                // in "with" mode, helpers are declared inside the with block to avoid
                // has check cost, but hoists are lifted out of the function - we need
                // to provide the helper here.
                if (ast.hoists.length) {
                    const staticHelpers = [
                        CREATE_VNODE,
                        CREATE_COMMENT,
                        CREATE_TEXT,
                        CREATE_STATIC
                    ]
                        .filter(helper => ast.helpers.includes(helper))
                        .map(aliasHelper)
                        .join(', ');
                    push(`const { ${staticHelpers} } = _Vue\n`);
                }
            }
        }
        genHoists(ast.hoists, context);
        newline();
        push(`return `);
    }
    function genAssets(assets, type, { helper, push, newline }) {
        const resolver = helper(type === 'component' ? RESOLVE_COMPONENT : RESOLVE_DIRECTIVE);
        for (let i = 0; i < assets.length; i++) {
            const id = assets[i];
            push(`const ${toValidAssetId(id, type)} = ${resolver}(${JSON.stringify(id)})`);
            if (i < assets.length - 1) {
                newline();
            }
        }
    }
    function genHoists(hoists, context) {
        if (!hoists.length) {
            return;
        }
        context.pure = true;
        const { push, newline, helper, scopeId, mode } = context;
        newline();
        hoists.forEach((exp, i) => {
            if (exp) {
                push(`const _hoisted_${i + 1} = `);
                genNode(exp, context);
                newline();
            }
        });
        context.pure = false;
    }
    function isText$1(n) {
        return (isString(n) ||
            n.type === 4 /* SIMPLE_EXPRESSION */ ||
            n.type === 2 /* TEXT */ ||
            n.type === 5 /* INTERPOLATION */ ||
            n.type === 8 /* COMPOUND_EXPRESSION */);
    }
    function genNodeListAsArray(nodes, context) {
        const multilines = nodes.length > 3 ||
            (nodes.some(n => isArray(n) || !isText$1(n)));
        context.push(`[`);
        multilines && context.indent();
        genNodeList(nodes, context, multilines);
        multilines && context.deindent();
        context.push(`]`);
    }
    function genNodeList(nodes, context, multilines = false, comma = true) {
        const { push, newline } = context;
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (isString(node)) {
                push(node);
            }
            else if (isArray(node)) {
                genNodeListAsArray(node, context);
            }
            else {
                genNode(node, context);
            }
            if (i < nodes.length - 1) {
                if (multilines) {
                    comma && push(',');
                    newline();
                }
                else {
                    comma && push(', ');
                }
            }
        }
    }
    function genNode(node, context) {
        if (isString(node)) {
            context.push(node);
            return;
        }
        if (isSymbol(node)) {
            context.push(context.helper(node));
            return;
        }
        switch (node.type) {
            case 1 /* ELEMENT */:
            case 9 /* IF */:
            case 11 /* FOR */:
                assert(node.codegenNode != null, `Codegen node is missing for element/if/for node. ` +
                    `Apply appropriate transforms first.`);
                genNode(node.codegenNode, context);
                break;
            case 2 /* TEXT */:
                genText(node, context);
                break;
            case 4 /* SIMPLE_EXPRESSION */:
                genExpression(node, context);
                break;
            case 5 /* INTERPOLATION */:
                genInterpolation(node, context);
                break;
            case 12 /* TEXT_CALL */:
                genNode(node.codegenNode, context);
                break;
            case 8 /* COMPOUND_EXPRESSION */:
                genCompoundExpression(node, context);
                break;
            case 3 /* COMMENT */:
                genComment(node, context);
                break;
            case 13 /* VNODE_CALL */:
                genVNodeCall(node, context);
                break;
            case 14 /* JS_CALL_EXPRESSION */:
                genCallExpression(node, context);
                break;
            case 15 /* JS_OBJECT_EXPRESSION */:
                genObjectExpression(node, context);
                break;
            case 17 /* JS_ARRAY_EXPRESSION */:
                genArrayExpression(node, context);
                break;
            case 18 /* JS_FUNCTION_EXPRESSION */:
                genFunctionExpression(node, context);
                break;
            case 19 /* JS_CONDITIONAL_EXPRESSION */:
                genConditionalExpression(node, context);
                break;
            case 20 /* JS_CACHE_EXPRESSION */:
                genCacheExpression(node, context);
                break;
            // SSR only types
            case 21 /* JS_BLOCK_STATEMENT */:
                break;
            case 22 /* JS_TEMPLATE_LITERAL */:
                break;
            case 23 /* JS_IF_STATEMENT */:
                break;
            case 24 /* JS_ASSIGNMENT_EXPRESSION */:
                break;
            case 25 /* JS_SEQUENCE_EXPRESSION */:
                break;
            case 26 /* JS_RETURN_STATEMENT */:
                break;
            /* istanbul ignore next */
            case 10 /* IF_BRANCH */:
                // noop
                break;
            default:
                {
                    assert(false, `unhandled codegen node type: ${node.type}`);
                    // make sure we exhaust all possible types
                    const exhaustiveCheck = node;
                    return exhaustiveCheck;
                }
        }
    }
    function genText(node, context) {
        context.push(JSON.stringify(node.content), node);
    }
    function genExpression(node, context) {
        const { content, isStatic } = node;
        context.push(isStatic ? JSON.stringify(content) : content, node);
    }
    function genInterpolation(node, context) {
        const { push, helper, pure } = context;
        if (pure)
            push(PURE_ANNOTATION);
        push(`${helper(TO_DISPLAY_STRING)}(`);
        genNode(node.content, context);
        push(`)`);
    }
    function genCompoundExpression(node, context) {
        for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (isString(child)) {
                context.push(child);
            }
            else {
                genNode(child, context);
            }
        }
    }
    function genExpressionAsPropertyKey(node, context) {
        const { push } = context;
        if (node.type === 8 /* COMPOUND_EXPRESSION */) {
            push(`[`);
            genCompoundExpression(node, context);
            push(`]`);
        }
        else if (node.isStatic) {
            // only quote keys if necessary
            const text = isSimpleIdentifier(node.content)
                ? node.content
                : JSON.stringify(node.content);
            push(text, node);
        }
        else {
            push(`[${node.content}]`, node);
        }
    }
    function genComment(node, context) {
        {
            const { push, helper, pure } = context;
            if (pure) {
                push(PURE_ANNOTATION);
            }
            push(`${helper(CREATE_COMMENT)}(${JSON.stringify(node.content)})`, node);
        }
    }
    function genVNodeCall(node, context) {
        const { push, helper, pure } = context;
        const { tag, props, children, patchFlag, dynamicProps, directives, isBlock, disableTracking } = node;
        if (directives) {
            push(helper(WITH_DIRECTIVES) + `(`);
        }
        if (isBlock) {
            push(`(${helper(OPEN_BLOCK)}(${disableTracking ? `true` : ``}), `);
        }
        if (pure) {
            push(PURE_ANNOTATION);
        }
        push(helper(isBlock ? CREATE_BLOCK : CREATE_VNODE) + `(`, node);
        genNodeList(genNullableArgs([tag, props, children, patchFlag, dynamicProps]), context);
        push(`)`);
        if (isBlock) {
            push(`)`);
        }
        if (directives) {
            push(`, `);
            genNode(directives, context);
            push(`)`);
        }
    }
    function genNullableArgs(args) {
        let i = args.length;
        while (i--) {
            if (args[i] != null)
                break;
        }
        return args.slice(0, i + 1).map(arg => arg || `null`);
    }
    // JavaScript
    function genCallExpression(node, context) {
        const { push, helper, pure } = context;
        const callee = isString(node.callee) ? node.callee : helper(node.callee);
        if (pure) {
            push(PURE_ANNOTATION);
        }
        push(callee + `(`, node);
        genNodeList(node.arguments, context);
        push(`)`);
    }
    function genObjectExpression(node, context) {
        const { push, indent, deindent, newline } = context;
        const { properties } = node;
        if (!properties.length) {
            push(`{}`, node);
            return;
        }
        const multilines = properties.length > 1 ||
            (properties.some(p => p.value.type !== 4 /* SIMPLE_EXPRESSION */));
        push(multilines ? `{` : `{ `);
        multilines && indent();
        for (let i = 0; i < properties.length; i++) {
            const { key, value } = properties[i];
            // key
            genExpressionAsPropertyKey(key, context);
            push(`: `);
            // value
            genNode(value, context);
            if (i < properties.length - 1) {
                // will only reach this if it's multilines
                push(`,`);
                newline();
            }
        }
        multilines && deindent();
        push(multilines ? `}` : ` }`);
    }
    function genArrayExpression(node, context) {
        genNodeListAsArray(node.elements, context);
    }
    function genFunctionExpression(node, context) {
        const { push, indent, deindent, scopeId, mode } = context;
        const { params, returns, body, newline, isSlot } = node;
        if (isSlot) {
            push(`_${helperNameMap[WITH_CTX]}(`);
        }
        push(`(`, node);
        if (isArray(params)) {
            genNodeList(params, context);
        }
        else if (params) {
            genNode(params, context);
        }
        push(`) => `);
        if (newline || body) {
            push(`{`);
            indent();
        }
        if (returns) {
            if (newline) {
                push(`return `);
            }
            if (isArray(returns)) {
                genNodeListAsArray(returns, context);
            }
            else {
                genNode(returns, context);
            }
        }
        else if (body) {
            genNode(body, context);
        }
        if (newline || body) {
            deindent();
            push(`}`);
        }
        if (isSlot) {
            push(`)`);
        }
    }
    function genConditionalExpression(node, context) {
        const { test, consequent, alternate, newline: needNewline } = node;
        const { push, indent, deindent, newline } = context;
        if (test.type === 4 /* SIMPLE_EXPRESSION */) {
            const needsParens = !isSimpleIdentifier(test.content);
            needsParens && push(`(`);
            genExpression(test, context);
            needsParens && push(`)`);
        }
        else {
            push(`(`);
            genNode(test, context);
            push(`)`);
        }
        needNewline && indent();
        context.indentLevel++;
        needNewline || push(` `);
        push(`? `);
        genNode(consequent, context);
        context.indentLevel--;
        needNewline && newline();
        needNewline || push(` `);
        push(`: `);
        const isNested = alternate.type === 19 /* JS_CONDITIONAL_EXPRESSION */;
        if (!isNested) {
            context.indentLevel++;
        }
        genNode(alternate, context);
        if (!isNested) {
            context.indentLevel--;
        }
        needNewline && deindent(true /* without newline */);
    }
    function genCacheExpression(node, context) {
        const { push, helper, indent, deindent, newline } = context;
        push(`_cache[${node.index}] || (`);
        if (node.isVNode) {
            indent();
            push(`${helper(SET_BLOCK_TRACKING)}(-1),`);
            newline();
        }
        push(`_cache[${node.index}] = `);
        genNode(node.value, context);
        if (node.isVNode) {
            push(`,`);
            newline();
            push(`${helper(SET_BLOCK_TRACKING)}(1),`);
            newline();
            push(`_cache[${node.index}]`);
            deindent();
        }
        push(`)`);
    }

    // these keywords should not appear inside expressions, but operators like
    // typeof, instanceof and in are allowed
    const prohibitedKeywordRE = new RegExp('\\b' +
        ('do,if,for,let,new,try,var,case,else,with,await,break,catch,class,const,' +
            'super,throw,while,yield,delete,export,import,return,switch,default,' +
            'extends,finally,continue,debugger,function,arguments,typeof,void')
            .split(',')
            .join('\\b|\\b') +
        '\\b');
    // strip strings in expressions
    const stripStringRE = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*\$\{|\}(?:[^`\\]|\\.)*`|`(?:[^`\\]|\\.)*`/g;
    /**
     * Validate a non-prefixed expression.
     * This is only called when using the in-browser runtime compiler since it
     * doesn't prefix expressions.
     */
    function validateBrowserExpression(node, context, asParams = false, asRawStatements = false) {
        const exp = node.content;
        // empty expressions are validated per-directive since some directives
        // do allow empty expressions.
        if (!exp.trim()) {
            return;
        }
        try {
            new Function(asRawStatements
                ? ` ${exp} `
                : `return ${asParams ? `(${exp}) => {}` : `(${exp})`}`);
        }
        catch (e) {
            let message = e.message;
            const keywordMatch = exp
                .replace(stripStringRE, '')
                .match(prohibitedKeywordRE);
            if (keywordMatch) {
                message = `avoid using JavaScript keyword as property name: "${keywordMatch[0]}"`;
            }
            context.onError(createCompilerError(43 /* X_INVALID_EXPRESSION */, node.loc, undefined, message));
        }
    }

    const transformExpression = (node, context) => {
        if (node.type === 5 /* INTERPOLATION */) {
            node.content = processExpression(node.content, context);
        }
        else if (node.type === 1 /* ELEMENT */) {
            // handle directives on element
            for (let i = 0; i < node.props.length; i++) {
                const dir = node.props[i];
                // do not process for v-on & v-for since they are special handled
                if (dir.type === 7 /* DIRECTIVE */ && dir.name !== 'for') {
                    const exp = dir.exp;
                    const arg = dir.arg;
                    // do not process exp if this is v-on:arg - we need special handling
                    // for wrapping inline statements.
                    if (exp &&
                        exp.type === 4 /* SIMPLE_EXPRESSION */ &&
                        !(dir.name === 'on' && arg)) {
                        dir.exp = processExpression(exp, context,
                            // slot args must be processed as function params
                            dir.name === 'slot');
                    }
                    if (arg && arg.type === 4 /* SIMPLE_EXPRESSION */ && !arg.isStatic) {
                        dir.arg = processExpression(arg, context);
                    }
                }
            }
        }
    };
    // Important: since this function uses Node.js only dependencies, it should
    // always be used with a leading !true check so that it can be
    // tree-shaken from the browser build.
    function processExpression(node, context,
        // some expressions like v-slot props & v-for aliases should be parsed as
        // function params
        asParams = false,
        // v-on handler values may contain multiple statements
        asRawStatements = false) {
        {
            {
                // simple in-browser validation (same logic in 2.x)
                validateBrowserExpression(node, context, asParams, asRawStatements);
            }
            return node;
        }
    }

    const transformIf = createStructuralDirectiveTransform(/^(if|else|else-if)$/, (node, dir, context) => {
        return processIf(node, dir, context, (ifNode, branch, isRoot) => {
            // #1587: We need to dynamically increment the key based on the current
            // node's sibling nodes, since chained v-if/else branches are
            // rendered at the same depth
            const siblings = context.parent.children;
            let i = siblings.indexOf(ifNode);
            let key = 0;
            while (i-- >= 0) {
                const sibling = siblings[i];
                if (sibling && sibling.type === 9 /* IF */) {
                    key += sibling.branches.length;
                }
            }
            // Exit callback. Complete the codegenNode when all children have been
            // transformed.
            return () => {
                if (isRoot) {
                    ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
                }
                else {
                    // attach this branch's codegen node to the v-if root.
                    const parentCondition = getParentCondition(ifNode.codegenNode);
                    parentCondition.alternate = createCodegenNodeForBranch(branch, key + ifNode.branches.length - 1, context);
                }
            };
        });
    });
    // target-agnostic transform used for both Client and SSR
    function processIf(node, dir, context, processCodegen) {
        if (dir.name !== 'else' &&
            (!dir.exp || !dir.exp.content.trim())) {
            const loc = dir.exp ? dir.exp.loc : node.loc;
            context.onError(createCompilerError(27 /* X_V_IF_NO_EXPRESSION */, dir.loc));
            dir.exp = createSimpleExpression(`true`, false, loc);
        }
        if (dir.exp) {
            validateBrowserExpression(dir.exp, context);
        }
        if (dir.name === 'if') {
            const branch = createIfBranch(node, dir);
            const ifNode = {
                type: 9 /* IF */,
                loc: node.loc,
                branches: [branch]
            };
            context.replaceNode(ifNode);
            if (processCodegen) {
                return processCodegen(ifNode, branch, true);
            }
        }
        else {
            // locate the adjacent v-if
            const siblings = context.parent.children;
            const comments = [];
            let i = siblings.indexOf(node);
            while (i-- >= -1) {
                const sibling = siblings[i];
                if (sibling && sibling.type === 3 /* COMMENT */) {
                    context.removeNode(sibling);
                    comments.unshift(sibling);
                    continue;
                }
                if (sibling &&
                    sibling.type === 2 /* TEXT */ &&
                    !sibling.content.trim().length) {
                    context.removeNode(sibling);
                    continue;
                }
                if (sibling && sibling.type === 9 /* IF */) {
                    // move the node to the if node's branches
                    context.removeNode();
                    const branch = createIfBranch(node, dir);
                    if (comments.length) {
                        branch.children = [...comments, ...branch.children];
                    }
                    // check if user is forcing same key on different branches
                    {
                        const key = branch.userKey;
                        if (key) {
                            sibling.branches.forEach(({ userKey }) => {
                                if (isSameKey(userKey, key)) {
                                    context.onError(createCompilerError(28 /* X_V_IF_SAME_KEY */, branch.userKey.loc));
                                }
                            });
                        }
                    }
                    sibling.branches.push(branch);
                    const onExit = processCodegen && processCodegen(sibling, branch, false);
                    // since the branch was removed, it will not be traversed.
                    // make sure to traverse here.
                    traverseNode(branch, context);
                    // call on exit
                    if (onExit)
                        onExit();
                    // make sure to reset currentNode after traversal to indicate this
                    // node has been removed.
                    context.currentNode = null;
                }
                else {
                    context.onError(createCompilerError(29 /* X_V_ELSE_NO_ADJACENT_IF */, node.loc));
                }
                break;
            }
        }
    }
    function createIfBranch(node, dir) {
        return {
            type: 10 /* IF_BRANCH */,
            loc: node.loc,
            condition: dir.name === 'else' ? undefined : dir.exp,
            children: node.tagType === 3 /* TEMPLATE */ && !findDir(node, 'for')
                ? node.children
                : [node],
            userKey: findProp(node, `key`)
        };
    }
    function createCodegenNodeForBranch(branch, keyIndex, context) {
        if (branch.condition) {
            return createConditionalExpression(branch.condition, createChildrenCodegenNode(branch, keyIndex, context),
                // make sure to pass in asBlock: true so that the comment node call
                // closes the current block.
                createCallExpression(context.helper(CREATE_COMMENT), [
                    '"v-if"',
                    'true'
                ]));
        }
        else {
            return createChildrenCodegenNode(branch, keyIndex, context);
        }
    }
    function createChildrenCodegenNode(branch, keyIndex, context) {
        const { helper } = context;
        const keyProperty = createObjectProperty(`key`, createSimpleExpression(`${keyIndex}`, false, locStub, 2 /* CAN_HOIST */));
        const { children } = branch;
        const firstChild = children[0];
        const needFragmentWrapper = children.length !== 1 || firstChild.type !== 1 /* ELEMENT */;
        if (needFragmentWrapper) {
            if (children.length === 1 && firstChild.type === 11 /* FOR */) {
                // optimize away nested fragments when child is a ForNode
                const vnodeCall = firstChild.codegenNode;
                injectProp(vnodeCall, keyProperty, context);
                return vnodeCall;
            }
            else {
                return createVNodeCall(context, helper(FRAGMENT), createObjectExpression([keyProperty]), children, 64 /* STABLE_FRAGMENT */ +
                    (` /* ${PatchFlagNames[64 /* STABLE_FRAGMENT */]} */`
                    ), undefined, undefined, true, false, branch.loc);
            }
        }
        else {
            const vnodeCall = firstChild
                .codegenNode;
            // Change createVNode to createBlock.
            if (vnodeCall.type === 13 /* VNODE_CALL */) {
                vnodeCall.isBlock = true;
                helper(OPEN_BLOCK);
                helper(CREATE_BLOCK);
            }
            // inject branch key
            injectProp(vnodeCall, keyProperty, context);
            return vnodeCall;
        }
    }
    function isSameKey(a, b) {
        if (!a || a.type !== b.type) {
            return false;
        }
        if (a.type === 6 /* ATTRIBUTE */) {
            if (a.value.content !== b.value.content) {
                return false;
            }
        }
        else {
            // directive
            const exp = a.exp;
            const branchExp = b.exp;
            if (exp.type !== branchExp.type) {
                return false;
            }
            if (exp.type !== 4 /* SIMPLE_EXPRESSION */ ||
                (exp.isStatic !== branchExp.isStatic ||
                    exp.content !== branchExp.content)) {
                return false;
            }
        }
        return true;
    }
    function getParentCondition(node) {
        while (true) {
            if (node.type === 19 /* JS_CONDITIONAL_EXPRESSION */) {
                if (node.alternate.type === 19 /* JS_CONDITIONAL_EXPRESSION */) {
                    node = node.alternate;
                }
                else {
                    return node;
                }
            }
            else if (node.type === 20 /* JS_CACHE_EXPRESSION */) {
                node = node.value;
            }
        }
    }

    const transformFor = createStructuralDirectiveTransform('for', (node, dir, context) => {
        const { helper } = context;
        return processFor(node, dir, context, forNode => {
            // create the loop render function expression now, and add the
            // iterator on exit after all children have been traversed
            const renderExp = createCallExpression(helper(RENDER_LIST), [
                forNode.source
            ]);
            const keyProp = findProp(node, `key`);
            const keyProperty = keyProp
                ? createObjectProperty(`key`, keyProp.type === 6 /* ATTRIBUTE */
                    ? createSimpleExpression(keyProp.value.content, true)
                    : keyProp.exp)
                : null;
            const isStableFragment = forNode.source.type === 4 /* SIMPLE_EXPRESSION */ &&
                forNode.source.constType > 0 /* NOT_CONSTANT */;
            const fragmentFlag = isStableFragment
                ? 64 /* STABLE_FRAGMENT */
                : keyProp
                    ? 128 /* KEYED_FRAGMENT */
                    : 256 /* UNKEYED_FRAGMENT */;
            forNode.codegenNode = createVNodeCall(context, helper(FRAGMENT), undefined, renderExp, fragmentFlag +
                (` /* ${PatchFlagNames[fragmentFlag]} */`), undefined, undefined, true /* isBlock */, !isStableFragment /* disableTracking */, node.loc);
            return () => {
                // finish the codegen now that all children have been traversed
                let childBlock;
                const isTemplate = isTemplateNode(node);
                const { children } = forNode;
                // check <template v-for> key placement
                if (isTemplate) {
                    node.children.some(c => {
                        if (c.type === 1 /* ELEMENT */) {
                            const key = findProp(c, 'key');
                            if (key) {
                                context.onError(createCompilerError(32 /* X_V_FOR_TEMPLATE_KEY_PLACEMENT */, key.loc));
                                return true;
                            }
                        }
                    });
                }
                const needFragmentWrapper = children.length !== 1 || children[0].type !== 1 /* ELEMENT */;
                const slotOutlet = isSlotOutlet(node)
                    ? node
                    : isTemplate &&
                        node.children.length === 1 &&
                        isSlotOutlet(node.children[0])
                        ? node.children[0] // api-extractor somehow fails to infer this
                        : null;
                if (slotOutlet) {
                    // <slot v-for="..."> or <template v-for="..."><slot/></template>
                    childBlock = slotOutlet.codegenNode;
                    if (isTemplate && keyProperty) {
                        // <template v-for="..." :key="..."><slot/></template>
                        // we need to inject the key to the renderSlot() call.
                        // the props for renderSlot is passed as the 3rd argument.
                        injectProp(childBlock, keyProperty, context);
                    }
                }
                else if (needFragmentWrapper) {
                    // <template v-for="..."> with text or multi-elements
                    // should generate a fragment block for each loop
                    childBlock = createVNodeCall(context, helper(FRAGMENT), keyProperty ? createObjectExpression([keyProperty]) : undefined, node.children, 64 /* STABLE_FRAGMENT */ +
                        (` /* ${PatchFlagNames[64 /* STABLE_FRAGMENT */]} */`
                        ), undefined, undefined, true);
                }
                else {
                    // Normal element v-for. Directly use the child's codegenNode
                    // but mark it as a block.
                    childBlock = children[0]
                        .codegenNode;
                    if (isTemplate && keyProperty) {
                        injectProp(childBlock, keyProperty, context);
                    }
                    childBlock.isBlock = !isStableFragment;
                    if (childBlock.isBlock) {
                        helper(OPEN_BLOCK);
                        helper(CREATE_BLOCK);
                    }
                    else {
                        helper(CREATE_VNODE);
                    }
                }
                renderExp.arguments.push(createFunctionExpression(createForLoopParams(forNode.parseResult), childBlock, true /* force newline */));
            };
        });
    });
    // target-agnostic transform used for both Client and SSR
    function processFor(node, dir, context, processCodegen) {
        if (!dir.exp) {
            context.onError(createCompilerError(30 /* X_V_FOR_NO_EXPRESSION */, dir.loc));
            return;
        }
        const parseResult = parseForExpression(
            // can only be simple expression because vFor transform is applied
            // before expression transform.
            dir.exp, context);
        if (!parseResult) {
            context.onError(createCompilerError(31 /* X_V_FOR_MALFORMED_EXPRESSION */, dir.loc));
            return;
        }
        const { addIdentifiers, removeIdentifiers, scopes } = context;
        const { source, value, key, index } = parseResult;
        const forNode = {
            type: 11 /* FOR */,
            loc: dir.loc,
            source,
            valueAlias: value,
            keyAlias: key,
            objectIndexAlias: index,
            parseResult,
            children: isTemplateNode(node) ? node.children : [node]
        };
        context.replaceNode(forNode);
        // bookkeeping
        scopes.vFor++;
        const onExit = processCodegen && processCodegen(forNode);
        return () => {
            scopes.vFor--;
            if (onExit)
                onExit();
        };
    }
    const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
    // This regex doesn't cover the case if key or index aliases have destructuring,
    // but those do not make sense in the first place, so this works in practice.
    const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
    const stripParensRE = /^\(|\)$/g;
    function parseForExpression(input, context) {
        const loc = input.loc;
        const exp = input.content;
        const inMatch = exp.match(forAliasRE);
        if (!inMatch)
            return;
        const [, LHS, RHS] = inMatch;
        const result = {
            source: createAliasExpression(loc, RHS.trim(), exp.indexOf(RHS, LHS.length)),
            value: undefined,
            key: undefined,
            index: undefined
        };
        {
            validateBrowserExpression(result.source, context);
        }
        let valueContent = LHS.trim()
            .replace(stripParensRE, '')
            .trim();
        const trimmedOffset = LHS.indexOf(valueContent);
        const iteratorMatch = valueContent.match(forIteratorRE);
        if (iteratorMatch) {
            valueContent = valueContent.replace(forIteratorRE, '').trim();
            const keyContent = iteratorMatch[1].trim();
            let keyOffset;
            if (keyContent) {
                keyOffset = exp.indexOf(keyContent, trimmedOffset + valueContent.length);
                result.key = createAliasExpression(loc, keyContent, keyOffset);
                {
                    validateBrowserExpression(result.key, context, true);
                }
            }
            if (iteratorMatch[2]) {
                const indexContent = iteratorMatch[2].trim();
                if (indexContent) {
                    result.index = createAliasExpression(loc, indexContent, exp.indexOf(indexContent, result.key
                        ? keyOffset + keyContent.length
                        : trimmedOffset + valueContent.length));
                    {
                        validateBrowserExpression(result.index, context, true);
                    }
                }
            }
        }
        if (valueContent) {
            result.value = createAliasExpression(loc, valueContent, trimmedOffset);
            {
                validateBrowserExpression(result.value, context, true);
            }
        }
        return result;
    }
    function createAliasExpression(range, content, offset) {
        return createSimpleExpression(content, false, getInnerRange(range, offset, content.length));
    }
    function createForLoopParams({ value, key, index }) {
        const params = [];
        if (value) {
            params.push(value);
        }
        if (key) {
            if (!value) {
                params.push(createSimpleExpression(`_`, false));
            }
            params.push(key);
        }
        if (index) {
            if (!key) {
                if (!value) {
                    params.push(createSimpleExpression(`_`, false));
                }
                params.push(createSimpleExpression(`__`, false));
            }
            params.push(index);
        }
        return params;
    }

    const defaultFallback = createSimpleExpression(`undefined`, false);
    // A NodeTransform that:
    // 1. Tracks scope identifiers for scoped slots so that they don't get prefixed
    //    by transformExpression. This is only applied in non-browser builds with
    //    { prefixIdentifiers: true }.
    // 2. Track v-slot depths so that we know a slot is inside another slot.
    //    Note the exit callback is executed before buildSlots() on the same node,
    //    so only nested slots see positive numbers.
    const trackSlotScopes = (node, context) => {
        if (node.type === 1 /* ELEMENT */ &&
            (node.tagType === 1 /* COMPONENT */ ||
                node.tagType === 3 /* TEMPLATE */)) {
            // We are only checking non-empty v-slot here
            // since we only care about slots that introduce scope variables.
            const vSlot = findDir(node, 'slot');
            if (vSlot) {
                vSlot.exp;
                context.scopes.vSlot++;
                return () => {
                    context.scopes.vSlot--;
                };
            }
        }
    };
    const buildClientSlotFn = (props, children, loc) => createFunctionExpression(props, children, false /* newline */, true /* isSlot */, children.length ? children[0].loc : loc);
    // Instead of being a DirectiveTransform, v-slot processing is called during
    // transformElement to build the slots object for a component.
    function buildSlots(node, context, buildSlotFn = buildClientSlotFn) {
        context.helper(WITH_CTX);
        const { children, loc } = node;
        const slotsProperties = [];
        const dynamicSlots = [];
        const buildDefaultSlotProperty = (props, children) => createObjectProperty(`default`, buildSlotFn(props, children, loc));
        // If the slot is inside a v-for or another v-slot, force it to be dynamic
        // since it likely uses a scope variable.
        let hasDynamicSlots = context.scopes.vSlot > 0 || context.scopes.vFor > 0;
        // 1. Check for slot with slotProps on component itself.
        //    <Comp v-slot="{ prop }"/>
        const onComponentSlot = findDir(node, 'slot', true);
        if (onComponentSlot) {
            const { arg, exp } = onComponentSlot;
            if (arg && !isStaticExp(arg)) {
                hasDynamicSlots = true;
            }
            slotsProperties.push(createObjectProperty(arg || createSimpleExpression('default', true), buildSlotFn(exp, children, loc)));
        }
        // 2. Iterate through children and check for template slots
        //    <template v-slot:foo="{ prop }">
        let hasTemplateSlots = false;
        let hasNamedDefaultSlot = false;
        const implicitDefaultChildren = [];
        const seenSlotNames = new Set();
        for (let i = 0; i < children.length; i++) {
            const slotElement = children[i];
            let slotDir;
            if (!isTemplateNode(slotElement) ||
                !(slotDir = findDir(slotElement, 'slot', true))) {
                // not a <template v-slot>, skip.
                if (slotElement.type !== 3 /* COMMENT */) {
                    implicitDefaultChildren.push(slotElement);
                }
                continue;
            }
            if (onComponentSlot) {
                // already has on-component slot - this is incorrect usage.
                context.onError(createCompilerError(36 /* X_V_SLOT_MIXED_SLOT_USAGE */, slotDir.loc));
                break;
            }
            hasTemplateSlots = true;
            const { children: slotChildren, loc: slotLoc } = slotElement;
            const { arg: slotName = createSimpleExpression(`default`, true), exp: slotProps, loc: dirLoc } = slotDir;
            // check if name is dynamic.
            let staticSlotName;
            if (isStaticExp(slotName)) {
                staticSlotName = slotName ? slotName.content : `default`;
            }
            else {
                hasDynamicSlots = true;
            }
            const slotFunction = buildSlotFn(slotProps, slotChildren, slotLoc);
            // check if this slot is conditional (v-if/v-for)
            let vIf;
            let vElse;
            let vFor;
            if ((vIf = findDir(slotElement, 'if'))) {
                hasDynamicSlots = true;
                dynamicSlots.push(createConditionalExpression(vIf.exp, buildDynamicSlot(slotName, slotFunction), defaultFallback));
            }
            else if ((vElse = findDir(slotElement, /^else(-if)?$/, true /* allowEmpty */))) {
                // find adjacent v-if
                let j = i;
                let prev;
                while (j--) {
                    prev = children[j];
                    if (prev.type !== 3 /* COMMENT */) {
                        break;
                    }
                }
                if (prev && isTemplateNode(prev) && findDir(prev, 'if')) {
                    // remove node
                    children.splice(i, 1);
                    i--;
                    // attach this slot to previous conditional
                    let conditional = dynamicSlots[dynamicSlots.length - 1];
                    while (conditional.alternate.type === 19 /* JS_CONDITIONAL_EXPRESSION */) {
                        conditional = conditional.alternate;
                    }
                    conditional.alternate = vElse.exp
                        ? createConditionalExpression(vElse.exp, buildDynamicSlot(slotName, slotFunction), defaultFallback)
                        : buildDynamicSlot(slotName, slotFunction);
                }
                else {
                    context.onError(createCompilerError(29 /* X_V_ELSE_NO_ADJACENT_IF */, vElse.loc));
                }
            }
            else if ((vFor = findDir(slotElement, 'for'))) {
                hasDynamicSlots = true;
                const parseResult = vFor.parseResult ||
                    parseForExpression(vFor.exp, context);
                if (parseResult) {
                    // Render the dynamic slots as an array and add it to the createSlot()
                    // args. The runtime knows how to handle it appropriately.
                    dynamicSlots.push(createCallExpression(context.helper(RENDER_LIST), [
                        parseResult.source,
                        createFunctionExpression(createForLoopParams(parseResult), buildDynamicSlot(slotName, slotFunction), true /* force newline */)
                    ]));
                }
                else {
                    context.onError(createCompilerError(31 /* X_V_FOR_MALFORMED_EXPRESSION */, vFor.loc));
                }
            }
            else {
                // check duplicate static names
                if (staticSlotName) {
                    if (seenSlotNames.has(staticSlotName)) {
                        context.onError(createCompilerError(37 /* X_V_SLOT_DUPLICATE_SLOT_NAMES */, dirLoc));
                        continue;
                    }
                    seenSlotNames.add(staticSlotName);
                    if (staticSlotName === 'default') {
                        hasNamedDefaultSlot = true;
                    }
                }
                slotsProperties.push(createObjectProperty(slotName, slotFunction));
            }
        }
        if (!onComponentSlot) {
            if (!hasTemplateSlots) {
                // implicit default slot (on component)
                slotsProperties.push(buildDefaultSlotProperty(undefined, children));
            }
            else if (implicitDefaultChildren.length) {
                // implicit default slot (mixed with named slots)
                if (hasNamedDefaultSlot) {
                    context.onError(createCompilerError(38 /* X_V_SLOT_EXTRANEOUS_DEFAULT_SLOT_CHILDREN */, implicitDefaultChildren[0].loc));
                }
                else {
                    slotsProperties.push(buildDefaultSlotProperty(undefined, implicitDefaultChildren));
                }
            }
        }
        const slotFlag = hasDynamicSlots
            ? 2 /* DYNAMIC */
            : hasForwardedSlots(node.children)
                ? 3 /* FORWARDED */
                : 1 /* STABLE */;
        let slots = createObjectExpression(slotsProperties.concat(createObjectProperty(`_`,
            // 2 = compiled but dynamic = can skip normalization, but must run diff
            // 1 = compiled and static = can skip normalization AND diff as optimized
            createSimpleExpression(slotFlag + (` /* ${slotFlagsText[slotFlag]} */`), false))), loc);
        if (dynamicSlots.length) {
            slots = createCallExpression(context.helper(CREATE_SLOTS), [
                slots,
                createArrayExpression(dynamicSlots)
            ]);
        }
        return {
            slots,
            hasDynamicSlots
        };
    }
    function buildDynamicSlot(name, fn) {
        return createObjectExpression([
            createObjectProperty(`name`, name),
            createObjectProperty(`fn`, fn)
        ]);
    }
    function hasForwardedSlots(children) {
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            if (child.type === 1 /* ELEMENT */) {
                if (child.tagType === 2 /* SLOT */ ||
                    (child.tagType === 0 /* ELEMENT */ &&
                        hasForwardedSlots(child.children))) {
                    return true;
                }
            }
        }
        return false;
    }

    // some directive transforms (e.g. v-model) may return a symbol for runtime
    // import, which should be used instead of a resolveDirective call.
    const directiveImportMap = new WeakMap();
    // generate a JavaScript AST for this element's codegen
    const transformElement = (node, context) => {
        if (!(node.type === 1 /* ELEMENT */ &&
            (node.tagType === 0 /* ELEMENT */ ||
                node.tagType === 1 /* COMPONENT */))) {
            return;
        }
        // perform the work on exit, after all child expressions have been
        // processed and merged.
        return function postTransformElement() {
            const { tag, props } = node;
            const isComponent = node.tagType === 1 /* COMPONENT */;
            // The goal of the transform is to create a codegenNode implementing the
            // VNodeCall interface.
            const vnodeTag = isComponent
                ? resolveComponentType(node, context)
                : `"${tag}"`;
            const isDynamicComponent = isObject(vnodeTag) && vnodeTag.callee === RESOLVE_DYNAMIC_COMPONENT;
            let vnodeProps;
            let vnodeChildren;
            let vnodePatchFlag;
            let patchFlag = 0;
            let vnodeDynamicProps;
            let dynamicPropNames;
            let vnodeDirectives;
            let shouldUseBlock =
                // dynamic component may resolve to plain elements
                isDynamicComponent ||
                vnodeTag === TELEPORT ||
                vnodeTag === SUSPENSE ||
                (!isComponent &&
                    // <svg> and <foreignObject> must be forced into blocks so that block
                    // updates inside get proper isSVG flag at runtime. (#639, #643)
                    // This is technically web-specific, but splitting the logic out of core
                    // leads to too much unnecessary complexity.
                    (tag === 'svg' ||
                        tag === 'foreignObject' ||
                        // #938: elements with dynamic keys should be forced into blocks
                        findProp(node, 'key', true)));
            // props
            if (props.length > 0) {
                const propsBuildResult = buildProps(node, context);
                vnodeProps = propsBuildResult.props;
                patchFlag = propsBuildResult.patchFlag;
                dynamicPropNames = propsBuildResult.dynamicPropNames;
                const directives = propsBuildResult.directives;
                vnodeDirectives =
                    directives && directives.length
                        ? createArrayExpression(directives.map(dir => buildDirectiveArgs(dir, context)))
                        : undefined;
            }
            // children
            if (node.children.length > 0) {
                if (vnodeTag === KEEP_ALIVE) {
                    // Although a built-in component, we compile KeepAlive with raw children
                    // instead of slot functions so that it can be used inside Transition
                    // or other Transition-wrapping HOCs.
                    // To ensure correct updates with block optimizations, we need to:
                    // 1. Force keep-alive into a block. This avoids its children being
                    //    collected by a parent block.
                    shouldUseBlock = true;
                    // 2. Force keep-alive to always be updated, since it uses raw children.
                    patchFlag |= 1024 /* DYNAMIC_SLOTS */;
                    if (node.children.length > 1) {
                        context.onError(createCompilerError(44 /* X_KEEP_ALIVE_INVALID_CHILDREN */, {
                            start: node.children[0].loc.start,
                            end: node.children[node.children.length - 1].loc.end,
                            source: ''
                        }));
                    }
                }
                const shouldBuildAsSlots = isComponent &&
                    // Teleport is not a real component and has dedicated runtime handling
                    vnodeTag !== TELEPORT &&
                    // explained above.
                    vnodeTag !== KEEP_ALIVE;
                if (shouldBuildAsSlots) {
                    const { slots, hasDynamicSlots } = buildSlots(node, context);
                    vnodeChildren = slots;
                    if (hasDynamicSlots) {
                        patchFlag |= 1024 /* DYNAMIC_SLOTS */;
                    }
                }
                else if (node.children.length === 1 && vnodeTag !== TELEPORT) {
                    const child = node.children[0];
                    const type = child.type;
                    // check for dynamic text children
                    const hasDynamicTextChild = type === 5 /* INTERPOLATION */ ||
                        type === 8 /* COMPOUND_EXPRESSION */;
                    if (hasDynamicTextChild &&
                        getConstantType(child, context) === 0 /* NOT_CONSTANT */) {
                        patchFlag |= 1 /* TEXT */;
                    }
                    // pass directly if the only child is a text node
                    // (plain / interpolation / expression)
                    if (hasDynamicTextChild || type === 2 /* TEXT */) {
                        vnodeChildren = child;
                    }
                    else {
                        vnodeChildren = node.children;
                    }
                }
                else {
                    vnodeChildren = node.children;
                }
            }
            // patchFlag & dynamicPropNames
            if (patchFlag !== 0) {
                {
                    if (patchFlag < 0) {
                        // special flags (negative and mutually exclusive)
                        vnodePatchFlag = patchFlag + ` /* ${PatchFlagNames[patchFlag]} */`;
                    }
                    else {
                        // bitwise flags
                        const flagNames = Object.keys(PatchFlagNames)
                            .map(Number)
                            .filter(n => n > 0 && patchFlag & n)
                            .map(n => PatchFlagNames[n])
                            .join(`, `);
                        vnodePatchFlag = patchFlag + ` /* ${flagNames} */`;
                    }
                }
                if (dynamicPropNames && dynamicPropNames.length) {
                    vnodeDynamicProps = stringifyDynamicPropNames(dynamicPropNames);
                }
            }
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren, vnodePatchFlag, vnodeDynamicProps, vnodeDirectives, !!shouldUseBlock, false /* disableTracking */, node.loc);
        };
    };
    function resolveComponentType(node, context, ssr = false) {
        const { tag } = node;
        // 1. dynamic component
        const isProp = node.tag === 'component' ? findProp(node, 'is') : findDir(node, 'is');
        if (isProp) {
            const exp = isProp.type === 6 /* ATTRIBUTE */
                ? isProp.value && createSimpleExpression(isProp.value.content, true)
                : isProp.exp;
            if (exp) {
                return createCallExpression(context.helper(RESOLVE_DYNAMIC_COMPONENT), [
                    exp
                ]);
            }
        }
        // 2. built-in components (Teleport, Transition, KeepAlive, Suspense...)
        const builtIn = isCoreComponent(tag) || context.isBuiltInComponent(tag);
        if (builtIn) {
            // built-ins are simply fallthroughs / have special handling during ssr
            // so we don't need to import their runtime equivalents
            if (!ssr)
                context.helper(builtIn);
            return builtIn;
        }
        // 5. user component (resolve)
        context.helper(RESOLVE_COMPONENT);
        context.components.add(tag);
        return toValidAssetId(tag, `component`);
    }
    function buildProps(node, context, props = node.props, ssr = false) {
        const { tag, loc: elementLoc } = node;
        const isComponent = node.tagType === 1 /* COMPONENT */;
        let properties = [];
        const mergeArgs = [];
        const runtimeDirectives = [];
        // patchFlag analysis
        let patchFlag = 0;
        let hasRef = false;
        let hasClassBinding = false;
        let hasStyleBinding = false;
        let hasHydrationEventBinding = false;
        let hasDynamicKeys = false;
        let hasVnodeHook = false;
        const dynamicPropNames = [];
        const analyzePatchFlag = ({ key, value }) => {
            if (isStaticExp(key)) {
                const name = key.content;
                const isEventHandler = isOn(name);
                if (!isComponent &&
                    isEventHandler &&
                    // omit the flag for click handlers because hydration gives click
                    // dedicated fast path.
                    name.toLowerCase() !== 'onclick' &&
                    // omit v-model handlers
                    name !== 'onUpdate:modelValue' &&
                    // omit onVnodeXXX hooks
                    !isReservedProp(name)) {
                    hasHydrationEventBinding = true;
                }
                if (isEventHandler && isReservedProp(name)) {
                    hasVnodeHook = true;
                }
                if (value.type === 20 /* JS_CACHE_EXPRESSION */ ||
                    ((value.type === 4 /* SIMPLE_EXPRESSION */ ||
                        value.type === 8 /* COMPOUND_EXPRESSION */) &&
                        getConstantType(value, context) > 0)) {
                    // skip if the prop is a cached handler or has constant value
                    return;
                }
                if (name === 'ref') {
                    hasRef = true;
                }
                else if (name === 'class' && !isComponent) {
                    hasClassBinding = true;
                }
                else if (name === 'style' && !isComponent) {
                    hasStyleBinding = true;
                }
                else if (name !== 'key' && !dynamicPropNames.includes(name)) {
                    dynamicPropNames.push(name);
                }
            }
            else {
                hasDynamicKeys = true;
            }
        };
        for (let i = 0; i < props.length; i++) {
            // static attribute
            const prop = props[i];
            if (prop.type === 6 /* ATTRIBUTE */) {
                const { loc, name, value } = prop;
                let isStatic = true;
                if (name === 'ref') {
                    hasRef = true;
                }
                // skip :is on <component>
                if (name === 'is' && tag === 'component') {
                    continue;
                }
                properties.push(createObjectProperty(createSimpleExpression(name, true, getInnerRange(loc, 0, name.length)), createSimpleExpression(value ? value.content : '', isStatic, value ? value.loc : loc)));
            }
            else {
                // directives
                const { name, arg, exp, loc } = prop;
                const isBind = name === 'bind';
                const isOn = name === 'on';
                // skip v-slot - it is handled by its dedicated transform.
                if (name === 'slot') {
                    if (!isComponent) {
                        context.onError(createCompilerError(39 /* X_V_SLOT_MISPLACED */, loc));
                    }
                    continue;
                }
                // skip v-once - it is handled by its dedicated transform.
                if (name === 'once') {
                    continue;
                }
                // skip v-is and :is on <component>
                if (name === 'is' ||
                    (isBind && tag === 'component' && isBindKey(arg, 'is'))) {
                    continue;
                }
                // skip v-on in SSR compilation
                if (isOn && ssr) {
                    continue;
                }
                // special case for v-bind and v-on with no argument
                if (!arg && (isBind || isOn)) {
                    hasDynamicKeys = true;
                    if (exp) {
                        if (properties.length) {
                            mergeArgs.push(createObjectExpression(dedupeProperties(properties), elementLoc));
                            properties = [];
                        }
                        if (isBind) {
                            mergeArgs.push(exp);
                        }
                        else {
                            // v-on="obj" -> toHandlers(obj)
                            mergeArgs.push({
                                type: 14 /* JS_CALL_EXPRESSION */,
                                loc,
                                callee: context.helper(TO_HANDLERS),
                                arguments: [exp]
                            });
                        }
                    }
                    else {
                        context.onError(createCompilerError(isBind
                            ? 33 /* X_V_BIND_NO_EXPRESSION */
                            : 34 /* X_V_ON_NO_EXPRESSION */, loc));
                    }
                    continue;
                }
                const directiveTransform = context.directiveTransforms[name];
                if (directiveTransform) {
                    // has built-in directive transform.
                    const { props, needRuntime } = directiveTransform(prop, node, context);
                    !ssr && props.forEach(analyzePatchFlag);
                    properties.push(...props);
                    if (needRuntime) {
                        runtimeDirectives.push(prop);
                        if (isSymbol(needRuntime)) {
                            directiveImportMap.set(prop, needRuntime);
                        }
                    }
                }
                else {
                    // no built-in transform, this is a user custom directive.
                    runtimeDirectives.push(prop);
                }
            }
        }
        let propsExpression = undefined;
        // has v-bind="object" or v-on="object", wrap with mergeProps
        if (mergeArgs.length) {
            if (properties.length) {
                mergeArgs.push(createObjectExpression(dedupeProperties(properties), elementLoc));
            }
            if (mergeArgs.length > 1) {
                propsExpression = createCallExpression(context.helper(MERGE_PROPS), mergeArgs, elementLoc);
            }
            else {
                // single v-bind with nothing else - no need for a mergeProps call
                propsExpression = mergeArgs[0];
            }
        }
        else if (properties.length) {
            propsExpression = createObjectExpression(dedupeProperties(properties), elementLoc);
        }
        // patchFlag analysis
        if (hasDynamicKeys) {
            patchFlag |= 16 /* FULL_PROPS */;
        }
        else {
            if (hasClassBinding) {
                patchFlag |= 2 /* CLASS */;
            }
            if (hasStyleBinding) {
                patchFlag |= 4 /* STYLE */;
            }
            if (dynamicPropNames.length) {
                patchFlag |= 8 /* PROPS */;
            }
            if (hasHydrationEventBinding) {
                patchFlag |= 32 /* HYDRATE_EVENTS */;
            }
        }
        if ((patchFlag === 0 || patchFlag === 32 /* HYDRATE_EVENTS */) &&
            (hasRef || hasVnodeHook || runtimeDirectives.length > 0)) {
            patchFlag |= 512 /* NEED_PATCH */;
        }
        return {
            props: propsExpression,
            directives: runtimeDirectives,
            patchFlag,
            dynamicPropNames
        };
    }
    // Dedupe props in an object literal.
    // Literal duplicated attributes would have been warned during the parse phase,
    // however, it's possible to encounter duplicated `onXXX` handlers with different
    // modifiers. We also need to merge static and dynamic class / style attributes.
    // - onXXX handlers / style: merge into array
    // - class: merge into single expression with concatenation
    function dedupeProperties(properties) {
        const knownProps = new Map();
        const deduped = [];
        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            // dynamic keys are always allowed
            if (prop.key.type === 8 /* COMPOUND_EXPRESSION */ || !prop.key.isStatic) {
                deduped.push(prop);
                continue;
            }
            const name = prop.key.content;
            const existing = knownProps.get(name);
            if (existing) {
                if (name === 'style' || name === 'class' || name.startsWith('on')) {
                    mergeAsArray(existing, prop);
                }
                // unexpected duplicate, should have emitted error during parse
            }
            else {
                knownProps.set(name, prop);
                deduped.push(prop);
            }
        }
        return deduped;
    }
    function mergeAsArray(existing, incoming) {
        if (existing.value.type === 17 /* JS_ARRAY_EXPRESSION */) {
            existing.value.elements.push(incoming.value);
        }
        else {
            existing.value = createArrayExpression([existing.value, incoming.value], existing.loc);
        }
    }
    function buildDirectiveArgs(dir, context) {
        const dirArgs = [];
        const runtime = directiveImportMap.get(dir);
        if (runtime) {
            // built-in directive with runtime
            dirArgs.push(context.helperString(runtime));
        }
        else {
            {
                // inject statement for resolving directive
                context.helper(RESOLVE_DIRECTIVE);
                context.directives.add(dir.name);
                dirArgs.push(toValidAssetId(dir.name, `directive`));
            }
        }
        const { loc } = dir;
        if (dir.exp)
            dirArgs.push(dir.exp);
        if (dir.arg) {
            if (!dir.exp) {
                dirArgs.push(`void 0`);
            }
            dirArgs.push(dir.arg);
        }
        if (Object.keys(dir.modifiers).length) {
            if (!dir.arg) {
                if (!dir.exp) {
                    dirArgs.push(`void 0`);
                }
                dirArgs.push(`void 0`);
            }
            const trueExpression = createSimpleExpression(`true`, false, loc);
            dirArgs.push(createObjectExpression(dir.modifiers.map(modifier => createObjectProperty(modifier, trueExpression)), loc));
        }
        return createArrayExpression(dirArgs, dir.loc);
    }
    function stringifyDynamicPropNames(props) {
        let propsNamesString = `[`;
        for (let i = 0, l = props.length; i < l; i++) {
            propsNamesString += JSON.stringify(props[i]);
            if (i < l - 1)
                propsNamesString += ', ';
        }
        return propsNamesString + `]`;
    }

    const transformSlotOutlet = (node, context) => {
        if (isSlotOutlet(node)) {
            const { children, loc } = node;
            const { slotName, slotProps } = processSlotOutlet(node, context);
            const slotArgs = [
                context.prefixIdentifiers ? `_ctx.$slots` : `$slots`,
                slotName
            ];
            if (slotProps) {
                slotArgs.push(slotProps);
            }
            if (children.length) {
                if (!slotProps) {
                    slotArgs.push(`{}`);
                }
                slotArgs.push(createFunctionExpression([], children, false, false, loc));
            }
            node.codegenNode = createCallExpression(context.helper(RENDER_SLOT), slotArgs, loc);
        }
    };
    function processSlotOutlet(node, context) {
        let slotName = `"default"`;
        let slotProps = undefined;
        const nonNameProps = [];
        for (let i = 0; i < node.props.length; i++) {
            const p = node.props[i];
            if (p.type === 6 /* ATTRIBUTE */) {
                if (p.value) {
                    if (p.name === 'name') {
                        slotName = JSON.stringify(p.value.content);
                    }
                    else {
                        p.name = camelize(p.name);
                        nonNameProps.push(p);
                    }
                }
            }
            else {
                if (p.name === 'bind' && isBindKey(p.arg, 'name')) {
                    if (p.exp)
                        slotName = p.exp;
                }
                else {
                    if (p.name === 'bind' && p.arg && isStaticExp(p.arg)) {
                        p.arg.content = camelize(p.arg.content);
                    }
                    nonNameProps.push(p);
                }
            }
        }
        if (nonNameProps.length > 0) {
            const { props, directives } = buildProps(node, context, nonNameProps);
            slotProps = props;
            if (directives.length) {
                context.onError(createCompilerError(35 /* X_V_SLOT_UNEXPECTED_DIRECTIVE_ON_SLOT_OUTLET */, directives[0].loc));
            }
        }
        return {
            slotName,
            slotProps
        };
    }

    const fnExpRE = /^\s*([\w$_]+|\([^)]*?\))\s*=>|^\s*function(?:\s+[\w$]+)?\s*\(/;
    const transformOn = (dir, node, context, augmentor) => {
        const { loc, modifiers, arg } = dir;
        if (!dir.exp && !modifiers.length) {
            context.onError(createCompilerError(34 /* X_V_ON_NO_EXPRESSION */, loc));
        }
        let eventName;
        if (arg.type === 4 /* SIMPLE_EXPRESSION */) {
            if (arg.isStatic) {
                const rawName = arg.content;
                // for all event listeners, auto convert it to camelCase. See issue #2249
                eventName = createSimpleExpression(toHandlerKey(camelize(rawName)), true, arg.loc);
            }
            else {
                // #2388
                eventName = createCompoundExpression([
                    `${context.helperString(TO_HANDLER_KEY)}(`,
                    arg,
                    `)`
                ]);
            }
        }
        else {
            // already a compound expression.
            eventName = arg;
            eventName.children.unshift(`${context.helperString(TO_HANDLER_KEY)}(`);
            eventName.children.push(`)`);
        }
        // handler processing
        let exp = dir.exp;
        if (exp && !exp.content.trim()) {
            exp = undefined;
        }
        let shouldCache = context.cacheHandlers && !exp;
        if (exp) {
            const isMemberExp = isMemberExpression(exp.content);
            const isInlineStatement = !(isMemberExp || fnExpRE.test(exp.content));
            const hasMultipleStatements = exp.content.includes(`;`);
            {
                validateBrowserExpression(exp, context, false, hasMultipleStatements);
            }
            if (isInlineStatement || (shouldCache && isMemberExp)) {
                // wrap inline statement in a function expression
                exp = createCompoundExpression([
                    `${isInlineStatement
                        ? `$event`
                        : `${``}(...args)`} => ${hasMultipleStatements ? `{` : `(`}`,
                    exp,
                    hasMultipleStatements ? `}` : `)`
                ]);
            }
        }
        let ret = {
            props: [
                createObjectProperty(eventName, exp || createSimpleExpression(`() => {}`, false, loc))
            ]
        };
        // apply extended compiler augmentor
        if (augmentor) {
            ret = augmentor(ret);
        }
        if (shouldCache) {
            // cache handlers so that it's always the same handler being passed down.
            // this avoids unnecessary re-renders when users use inline handlers on
            // components.
            ret.props[0].value = context.cache(ret.props[0].value);
        }
        return ret;
    };

    // v-bind without arg is handled directly in ./transformElements.ts due to it affecting
    // codegen for the entire props object. This transform here is only for v-bind
    // *with* args.
    const transformBind = (dir, node, context) => {
        const { exp, modifiers, loc } = dir;
        const arg = dir.arg;
        if (arg.type !== 4 /* SIMPLE_EXPRESSION */) {
            arg.children.unshift(`(`);
            arg.children.push(`) || ""`);
        }
        else if (!arg.isStatic) {
            arg.content = `${arg.content} || ""`;
        }
        // .prop is no longer necessary due to new patch behavior
        // .sync is replaced by v-model:arg
        if (modifiers.includes('camel')) {
            if (arg.type === 4 /* SIMPLE_EXPRESSION */) {
                if (arg.isStatic) {
                    arg.content = camelize(arg.content);
                }
                else {
                    arg.content = `${context.helperString(CAMELIZE)}(${arg.content})`;
                }
            }
            else {
                arg.children.unshift(`${context.helperString(CAMELIZE)}(`);
                arg.children.push(`)`);
            }
        }
        if (!exp ||
            (exp.type === 4 /* SIMPLE_EXPRESSION */ && !exp.content.trim())) {
            context.onError(createCompilerError(33 /* X_V_BIND_NO_EXPRESSION */, loc));
            return {
                props: [createObjectProperty(arg, createSimpleExpression('', true, loc))]
            };
        }
        return {
            props: [createObjectProperty(arg, exp)]
        };
    };

    // Merge adjacent text nodes and expressions into a single expression
    // e.g. <div>abc {{ d }} {{ e }}</div> should have a single expression node as child.
    const transformText = (node, context) => {
        if (node.type === 0 /* ROOT */ ||
            node.type === 1 /* ELEMENT */ ||
            node.type === 11 /* FOR */ ||
            node.type === 10 /* IF_BRANCH */) {
            // perform the transform on node exit so that all expressions have already
            // been processed.
            return () => {
                const children = node.children;
                let currentContainer = undefined;
                let hasText = false;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (isText(child)) {
                        hasText = true;
                        for (let j = i + 1; j < children.length; j++) {
                            const next = children[j];
                            if (isText(next)) {
                                if (!currentContainer) {
                                    currentContainer = children[i] = {
                                        type: 8 /* COMPOUND_EXPRESSION */,
                                        loc: child.loc,
                                        children: [child]
                                    };
                                }
                                // merge adjacent text node into current
                                currentContainer.children.push(` + `, next);
                                children.splice(j, 1);
                                j--;
                            }
                            else {
                                currentContainer = undefined;
                                break;
                            }
                        }
                    }
                }
                if (!hasText ||
                    // if this is a plain element with a single text child, leave it
                    // as-is since the runtime has dedicated fast path for this by directly
                    // setting textContent of the element.
                    // for component root it's always normalized anyway.
                    (children.length === 1 &&
                        (node.type === 0 /* ROOT */ ||
                            (node.type === 1 /* ELEMENT */ &&
                                node.tagType === 0 /* ELEMENT */)))) {
                    return;
                }
                // pre-convert text nodes into createTextVNode(text) calls to avoid
                // runtime normalization.
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (isText(child) || child.type === 8 /* COMPOUND_EXPRESSION */) {
                        const callArgs = [];
                        // createTextVNode defaults to single whitespace, so if it is a
                        // single space the code could be an empty call to save bytes.
                        if (child.type !== 2 /* TEXT */ || child.content !== ' ') {
                            callArgs.push(child);
                        }
                        // mark dynamic text with flag so it gets patched inside a block
                        if (!context.ssr &&
                            getConstantType(child, context) === 0 /* NOT_CONSTANT */) {
                            callArgs.push(1 /* TEXT */ +
                                (` /* ${PatchFlagNames[1 /* TEXT */]} */`));
                        }
                        children[i] = {
                            type: 12 /* TEXT_CALL */,
                            content: child,
                            loc: child.loc,
                            codegenNode: createCallExpression(context.helper(CREATE_TEXT), callArgs)
                        };
                    }
                }
            };
        }
    };

    const seen = new WeakSet();
    const transformOnce = (node, context) => {
        if (node.type === 1 /* ELEMENT */ && findDir(node, 'once', true)) {
            if (seen.has(node)) {
                return;
            }
            seen.add(node);
            context.helper(SET_BLOCK_TRACKING);
            return () => {
                const cur = context.currentNode;
                if (cur.codegenNode) {
                    cur.codegenNode = context.cache(cur.codegenNode, true /* isVNode */);
                }
            };
        }
    };

    const transformModel = (dir, node, context) => {
        const { exp, arg } = dir;
        if (!exp) {
            context.onError(createCompilerError(40 /* X_V_MODEL_NO_EXPRESSION */, dir.loc));
            return createTransformProps();
        }
        const rawExp = exp.loc.source;
        const expString = exp.type === 4 /* SIMPLE_EXPRESSION */ ? exp.content : rawExp;
        // im SFC <script setup> inline mode, the exp may have been transformed into
        // _unref(exp)
        context.bindingMetadata[rawExp];
        const maybeRef = !true    /* SETUP_CONST */;
        if (!isMemberExpression(expString) && !maybeRef) {
            context.onError(createCompilerError(41 /* X_V_MODEL_MALFORMED_EXPRESSION */, exp.loc));
            return createTransformProps();
        }
        const propName = arg ? arg : createSimpleExpression('modelValue', true);
        const eventName = arg
            ? isStaticExp(arg)
                ? `onUpdate:${arg.content}`
                : createCompoundExpression(['"onUpdate:" + ', arg])
            : `onUpdate:modelValue`;
        let assignmentExp;
        const eventArg = context.isTS ? `($event: any)` : `$event`;
        {
            assignmentExp = createCompoundExpression([
                `${eventArg} => (`,
                exp,
                ` = $event)`
            ]);
        }
        const props = [
            // modelValue: foo
            createObjectProperty(propName, dir.exp),
            // "onUpdate:modelValue": $event => (foo = $event)
            createObjectProperty(eventName, assignmentExp)
        ];
        // modelModifiers: { foo: true, "bar-baz": true }
        if (dir.modifiers.length && node.tagType === 1 /* COMPONENT */) {
            const modifiers = dir.modifiers
                .map(m => (isSimpleIdentifier(m) ? m : JSON.stringify(m)) + `: true`)
                .join(`, `);
            const modifiersKey = arg
                ? isStaticExp(arg)
                    ? `${arg.content}Modifiers`
                    : createCompoundExpression([arg, ' + "Modifiers"'])
                : `modelModifiers`;
            props.push(createObjectProperty(modifiersKey, createSimpleExpression(`{ ${modifiers} }`, false, dir.loc, 2 /* CAN_HOIST */)));
        }
        return createTransformProps(props);
    };
    function createTransformProps(props = []) {
        return { props };
    }

    function getBaseTransformPreset(prefixIdentifiers) {
        return [
            [
                transformOnce,
                transformIf,
                transformFor,
                ...([transformExpression]
                ),
                transformSlotOutlet,
                transformElement,
                trackSlotScopes,
                transformText
            ],
            {
                on: transformOn,
                bind: transformBind,
                model: transformModel
            }
        ];
    }
    // we name it `baseCompile` so that higher order compilers like
    // @vue/compiler-dom can export `compile` while re-exporting everything else.
    function baseCompile(template, options = {}) {
        const onError = options.onError || defaultOnError;
        const isModuleMode = options.mode === 'module';
        /* istanbul ignore if */
        {
            if (options.prefixIdentifiers === true) {
                onError(createCompilerError(45 /* X_PREFIX_ID_NOT_SUPPORTED */));
            }
            else if (isModuleMode) {
                onError(createCompilerError(46 /* X_MODULE_MODE_NOT_SUPPORTED */));
            }
        }
        const prefixIdentifiers = !true;
        if (options.cacheHandlers) {
            onError(createCompilerError(47 /* X_CACHE_HANDLER_NOT_SUPPORTED */));
        }
        if (options.scopeId && !isModuleMode) {
            onError(createCompilerError(48 /* X_SCOPE_ID_NOT_SUPPORTED */));
        }
        const ast = isString(template) ? baseParse(template, options) : template;
        const [nodeTransforms, directiveTransforms] = getBaseTransformPreset();
        transform(ast, extend({}, options, {
            prefixIdentifiers,
            nodeTransforms: [
                ...nodeTransforms,
                ...(options.nodeTransforms || []) // user transforms
            ],
            directiveTransforms: extend({}, directiveTransforms, options.directiveTransforms || {} // user transforms
            )
        }));
        return generate(ast, extend({}, options, {
            prefixIdentifiers
        }));
    }

    const noopDirectiveTransform = () => ({ props: [] });

    const V_MODEL_RADIO = Symbol(`vModelRadio`);
    const V_MODEL_CHECKBOX = Symbol(`vModelCheckbox`);
    const V_MODEL_TEXT = Symbol(`vModelText`);
    const V_MODEL_SELECT = Symbol(`vModelSelect`);
    const V_MODEL_DYNAMIC = Symbol(`vModelDynamic`);
    const V_ON_WITH_MODIFIERS = Symbol(`vOnModifiersGuard`);
    const V_ON_WITH_KEYS = Symbol(`vOnKeysGuard`);
    const V_SHOW = Symbol(`vShow`);
    const TRANSITION$1 = Symbol(`Transition`);
    const TRANSITION_GROUP = Symbol(`TransitionGroup`);
    registerRuntimeHelpers({
        [V_MODEL_RADIO]: `vModelRadio`,
        [V_MODEL_CHECKBOX]: `vModelCheckbox`,
        [V_MODEL_TEXT]: `vModelText`,
        [V_MODEL_SELECT]: `vModelSelect`,
        [V_MODEL_DYNAMIC]: `vModelDynamic`,
        [V_ON_WITH_MODIFIERS]: `withModifiers`,
        [V_ON_WITH_KEYS]: `withKeys`,
        [V_SHOW]: `vShow`,
        [TRANSITION$1]: `Transition`,
        [TRANSITION_GROUP]: `TransitionGroup`
    });

    /* eslint-disable no-restricted-globals */
    let decoder;
    function decodeHtmlBrowser(raw) {
        (decoder || (decoder = document.createElement('div'))).innerHTML = raw;
        return decoder.textContent;
    }

    const isRawTextContainer = /*#__PURE__*/ makeMap('style,iframe,script,noscript', true);
    const parserOptions = {
        isVoidTag,
        isNativeTag: tag => isHTMLTag(tag) || isSVGTag(tag),
        isPreTag: tag => tag === 'pre',
        decodeEntities: decodeHtmlBrowser,
        isBuiltInComponent: (tag) => {
            if (isBuiltInType(tag, `Transition`)) {
                return TRANSITION$1;
            }
            else if (isBuiltInType(tag, `TransitionGroup`)) {
                return TRANSITION_GROUP;
            }
        },
        // https://html.spec.whatwg.org/multipage/parsing.html#tree-construction-dispatcher
        getNamespace(tag, parent) {
            let ns = parent ? parent.ns : 0 /* HTML */;
            if (parent && ns === 2 /* MATH_ML */) {
                if (parent.tag === 'annotation-xml') {
                    if (tag === 'svg') {
                        return 1 /* SVG */;
                    }
                    if (parent.props.some(a => a.type === 6 /* ATTRIBUTE */ &&
                        a.name === 'encoding' &&
                        a.value != null &&
                        (a.value.content === 'text/html' ||
                            a.value.content === 'application/xhtml+xml'))) {
                        ns = 0 /* HTML */;
                    }
                }
                else if (/^m(?:[ions]|text)$/.test(parent.tag) &&
                    tag !== 'mglyph' &&
                    tag !== 'malignmark') {
                    ns = 0 /* HTML */;
                }
            }
            else if (parent && ns === 1 /* SVG */) {
                if (parent.tag === 'foreignObject' ||
                    parent.tag === 'desc' ||
                    parent.tag === 'title') {
                    ns = 0 /* HTML */;
                }
            }
            if (ns === 0 /* HTML */) {
                if (tag === 'svg') {
                    return 1 /* SVG */;
                }
                if (tag === 'math') {
                    return 2 /* MATH_ML */;
                }
            }
            return ns;
        },
        // https://html.spec.whatwg.org/multipage/parsing.html#parsing-html-fragments
        getTextMode({ tag, ns }) {
            if (ns === 0 /* HTML */) {
                if (tag === 'textarea' || tag === 'title') {
                    return 1 /* RCDATA */;
                }
                if (isRawTextContainer(tag)) {
                    return 2 /* RAWTEXT */;
                }
            }
            return 0 /* DATA */;
        }
    };

    // Parse inline CSS strings for static style attributes into an object.
    // This is a NodeTransform since it works on the static `style` attribute and
    // converts it into a dynamic equivalent:
    // style="color: red" -> :style='{ "color": "red" }'
    // It is then processed by `transformElement` and included in the generated
    // props.
    const transformStyle = node => {
        if (node.type === 1 /* ELEMENT */) {
            node.props.forEach((p, i) => {
                if (p.type === 6 /* ATTRIBUTE */ && p.name === 'style' && p.value) {
                    // replace p with an expression node
                    node.props[i] = {
                        type: 7 /* DIRECTIVE */,
                        name: `bind`,
                        arg: createSimpleExpression(`style`, true, p.loc),
                        exp: parseInlineCSS(p.value.content, p.loc),
                        modifiers: [],
                        loc: p.loc
                    };
                }
            });
        }
    };
    const parseInlineCSS = (cssText, loc) => {
        const normalized = parseStringStyle(cssText);
        return createSimpleExpression(JSON.stringify(normalized), false, loc, 3 /* CAN_STRINGIFY */);
    };

    function createDOMCompilerError(code, loc) {
        return createCompilerError(code, loc, DOMErrorMessages);
    }
    const DOMErrorMessages = {
        [49 /* X_V_HTML_NO_EXPRESSION */]: `v-html is missing expression.`,
        [50 /* X_V_HTML_WITH_CHILDREN */]: `v-html will override element children.`,
        [51 /* X_V_TEXT_NO_EXPRESSION */]: `v-text is missing expression.`,
        [52 /* X_V_TEXT_WITH_CHILDREN */]: `v-text will override element children.`,
        [53 /* X_V_MODEL_ON_INVALID_ELEMENT */]: `v-model can only be used on <input>, <textarea> and <select> elements.`,
        [54 /* X_V_MODEL_ARG_ON_ELEMENT */]: `v-model argument is not supported on plain elements.`,
        [55 /* X_V_MODEL_ON_FILE_INPUT_ELEMENT */]: `v-model cannot be used on file inputs since they are read-only. Use a v-on:change listener instead.`,
        [56 /* X_V_MODEL_UNNECESSARY_VALUE */]: `Unnecessary value binding used alongside v-model. It will interfere with v-model's behavior.`,
        [57 /* X_V_SHOW_NO_EXPRESSION */]: `v-show is missing expression.`,
        [58 /* X_TRANSITION_INVALID_CHILDREN */]: `<Transition> expects exactly one child element or component.`,
        [59 /* X_IGNORED_SIDE_EFFECT_TAG */]: `Tags with side effect (<script> and <style>) are ignored in client component templates.`
    };

    const transformVHtml = (dir, node, context) => {
        const { exp, loc } = dir;
        if (!exp) {
            context.onError(createDOMCompilerError(49 /* X_V_HTML_NO_EXPRESSION */, loc));
        }
        if (node.children.length) {
            context.onError(createDOMCompilerError(50 /* X_V_HTML_WITH_CHILDREN */, loc));
            node.children.length = 0;
        }
        return {
            props: [
                createObjectProperty(createSimpleExpression(`innerHTML`, true, loc), exp || createSimpleExpression('', true))
            ]
        };
    };

    const transformVText = (dir, node, context) => {
        const { exp, loc } = dir;
        if (!exp) {
            context.onError(createDOMCompilerError(51 /* X_V_TEXT_NO_EXPRESSION */, loc));
        }
        if (node.children.length) {
            context.onError(createDOMCompilerError(52 /* X_V_TEXT_WITH_CHILDREN */, loc));
            node.children.length = 0;
        }
        return {
            props: [
                createObjectProperty(createSimpleExpression(`textContent`, true), exp
                    ? createCallExpression(context.helperString(TO_DISPLAY_STRING), [exp], loc)
                    : createSimpleExpression('', true))
            ]
        };
    };

    const transformModel$1 = (dir, node, context) => {
        const baseResult = transformModel(dir, node, context);
        // base transform has errors OR component v-model (only need props)
        if (!baseResult.props.length || node.tagType === 1 /* COMPONENT */) {
            return baseResult;
        }
        if (dir.arg) {
            context.onError(createDOMCompilerError(54 /* X_V_MODEL_ARG_ON_ELEMENT */, dir.arg.loc));
        }
        function checkDuplicatedValue() {
            const value = findProp(node, 'value');
            if (value) {
                context.onError(createDOMCompilerError(56 /* X_V_MODEL_UNNECESSARY_VALUE */, value.loc));
            }
        }
        const { tag } = node;
        const isCustomElement = context.isCustomElement(tag);
        if (tag === 'input' ||
            tag === 'textarea' ||
            tag === 'select' ||
            isCustomElement) {
            let directiveToUse = V_MODEL_TEXT;
            let isInvalidType = false;
            if (tag === 'input' || isCustomElement) {
                const type = findProp(node, `type`);
                if (type) {
                    if (type.type === 7 /* DIRECTIVE */) {
                        // :type="foo"
                        directiveToUse = V_MODEL_DYNAMIC;
                    }
                    else if (type.value) {
                        switch (type.value.content) {
                            case 'radio':
                                directiveToUse = V_MODEL_RADIO;
                                break;
                            case 'checkbox':
                                directiveToUse = V_MODEL_CHECKBOX;
                                break;
                            case 'file':
                                isInvalidType = true;
                                context.onError(createDOMCompilerError(55 /* X_V_MODEL_ON_FILE_INPUT_ELEMENT */, dir.loc));
                                break;
                            default:
                                // text type
                                checkDuplicatedValue();
                                break;
                        }
                    }
                }
                else if (hasDynamicKeyVBind(node)) {
                    // element has bindings with dynamic keys, which can possibly contain
                    // "type".
                    directiveToUse = V_MODEL_DYNAMIC;
                }
                else {
                    // text type
                    checkDuplicatedValue();
                }
            }
            else if (tag === 'select') {
                directiveToUse = V_MODEL_SELECT;
            }
            else {
                // textarea
                checkDuplicatedValue();
            }
            // inject runtime directive
            // by returning the helper symbol via needRuntime
            // the import will replaced a resolveDirective call.
            if (!isInvalidType) {
                baseResult.needRuntime = context.helper(directiveToUse);
            }
        }
        else {
            context.onError(createDOMCompilerError(53 /* X_V_MODEL_ON_INVALID_ELEMENT */, dir.loc));
        }
        // native vmodel doesn't need the `modelValue` props since they are also
        // passed to the runtime as `binding.value`. removing it reduces code size.
        baseResult.props = baseResult.props.filter(p => !(p.key.type === 4 /* SIMPLE_EXPRESSION */ &&
            p.key.content === 'modelValue'));
        return baseResult;
    };

    const isEventOptionModifier = /*#__PURE__*/ makeMap(`passive,once,capture`);
    const isNonKeyModifier = /*#__PURE__*/ makeMap(
        // event propagation management
        `stop,prevent,self,` +
        // system modifiers + exact
        `ctrl,shift,alt,meta,exact,` +
        // mouse
        `middle`);
    // left & right could be mouse or key modifiers based on event type
    const maybeKeyModifier = /*#__PURE__*/ makeMap('left,right');
    const isKeyboardEvent = /*#__PURE__*/ makeMap(`onkeyup,onkeydown,onkeypress`, true);
    const resolveModifiers = (key, modifiers) => {
        const keyModifiers = [];
        const nonKeyModifiers = [];
        const eventOptionModifiers = [];
        for (let i = 0; i < modifiers.length; i++) {
            const modifier = modifiers[i];
            if (isEventOptionModifier(modifier)) {
                // eventOptionModifiers: modifiers for addEventListener() options,
                // e.g. .passive & .capture
                eventOptionModifiers.push(modifier);
            }
            else {
                // runtimeModifiers: modifiers that needs runtime guards
                if (maybeKeyModifier(modifier)) {
                    if (isStaticExp(key)) {
                        if (isKeyboardEvent(key.content)) {
                            keyModifiers.push(modifier);
                        }
                        else {
                            nonKeyModifiers.push(modifier);
                        }
                    }
                    else {
                        keyModifiers.push(modifier);
                        nonKeyModifiers.push(modifier);
                    }
                }
                else {
                    if (isNonKeyModifier(modifier)) {
                        nonKeyModifiers.push(modifier);
                    }
                    else {
                        keyModifiers.push(modifier);
                    }
                }
            }
        }
        return {
            keyModifiers,
            nonKeyModifiers,
            eventOptionModifiers
        };
    };
    const transformClick = (key, event) => {
        const isStaticClick = isStaticExp(key) && key.content.toLowerCase() === 'onclick';
        return isStaticClick
            ? createSimpleExpression(event, true)
            : key.type !== 4 /* SIMPLE_EXPRESSION */
                ? createCompoundExpression([
                    `(`,
                    key,
                    `) === "onClick" ? "${event}" : (`,
                    key,
                    `)`
                ])
                : key;
    };
    const transformOn$1 = (dir, node, context) => {
        return transformOn(dir, node, context, baseResult => {
            const { modifiers } = dir;
            if (!modifiers.length)
                return baseResult;
            let { key, value: handlerExp } = baseResult.props[0];
            const { keyModifiers, nonKeyModifiers, eventOptionModifiers } = resolveModifiers(key, modifiers);
            // normalize click.right and click.middle since they don't actually fire
            if (nonKeyModifiers.includes('right')) {
                key = transformClick(key, `onContextmenu`);
            }
            if (nonKeyModifiers.includes('middle')) {
                key = transformClick(key, `onMouseup`);
            }
            if (nonKeyModifiers.length) {
                handlerExp = createCallExpression(context.helper(V_ON_WITH_MODIFIERS), [
                    handlerExp,
                    JSON.stringify(nonKeyModifiers)
                ]);
            }
            if (keyModifiers.length &&
                // if event name is dynamic, always wrap with keys guard
                (!isStaticExp(key) || isKeyboardEvent(key.content))) {
                handlerExp = createCallExpression(context.helper(V_ON_WITH_KEYS), [
                    handlerExp,
                    JSON.stringify(keyModifiers)
                ]);
            }
            if (eventOptionModifiers.length) {
                const modifierPostfix = eventOptionModifiers.map(capitalize).join('');
                key = isStaticExp(key)
                    ? createSimpleExpression(`${key.content}${modifierPostfix}`, true)
                    : createCompoundExpression([`(`, key, `) + "${modifierPostfix}"`]);
            }
            return {
                props: [createObjectProperty(key, handlerExp)]
            };
        });
    };

    const transformShow = (dir, node, context) => {
        const { exp, loc } = dir;
        if (!exp) {
            context.onError(createDOMCompilerError(57 /* X_V_SHOW_NO_EXPRESSION */, loc));
        }
        return {
            props: [],
            needRuntime: context.helper(V_SHOW)
        };
    };

    const warnTransitionChildren = (node, context) => {
        if (node.type === 1 /* ELEMENT */ &&
            node.tagType === 1 /* COMPONENT */) {
            const component = context.isBuiltInComponent(node.tag);
            if (component === TRANSITION$1) {
                return () => {
                    if (node.children.length && hasMultipleChildren(node)) {
                        context.onError(createDOMCompilerError(58 /* X_TRANSITION_INVALID_CHILDREN */, {
                            start: node.children[0].loc.start,
                            end: node.children[node.children.length - 1].loc.end,
                            source: ''
                        }));
                    }
                };
            }
        }
    };
    function hasMultipleChildren(node) {
        // #1352 filter out potential comment nodes.
        const children = (node.children = node.children.filter(c => c.type !== 3 /* COMMENT */));
        const child = children[0];
        return (children.length !== 1 ||
            child.type === 11 /* FOR */ ||
            (child.type === 9 /* IF */ && child.branches.some(hasMultipleChildren)));
    }

    const ignoreSideEffectTags = (node, context) => {
        if (node.type === 1 /* ELEMENT */ &&
            node.tagType === 0 /* ELEMENT */ &&
            (node.tag === 'script' || node.tag === 'style')) {
            context.onError(createDOMCompilerError(59 /* X_IGNORED_SIDE_EFFECT_TAG */, node.loc));
            context.removeNode();
        }
    };

    const DOMNodeTransforms = [
        transformStyle,
        ...([warnTransitionChildren])
    ];
    const DOMDirectiveTransforms = {
        cloak: noopDirectiveTransform,
        html: transformVHtml,
        text: transformVText,
        model: transformModel$1,
        on: transformOn$1,
        show: transformShow
    };
    function compile$1(template, options = {}) {
        return baseCompile(template, extend({}, parserOptions, options, {
            nodeTransforms: [
                // ignore <script> and <tag>
                // this is not put inside DOMNodeTransforms because that list is used
                // by compiler-ssr to generate vnode fallback branches
                ignoreSideEffectTags,
                ...DOMNodeTransforms,
                ...(options.nodeTransforms || [])
            ],
            directiveTransforms: extend({}, DOMDirectiveTransforms, options.directiveTransforms || {}),
            transformHoist: null
        }));
    }

    // This entry is the "full-build" that includes both the runtime
    {
        initDev();
    }
    const compileCache = Object.create(null);
    function compileToFunction(template, options) {
        if (!isString(template)) {
            if (template.nodeType) {
                template = template.innerHTML;
            }
            else {
                warn(`invalid template option: `, template);
                return NOOP;
            }
        }
        const key = template;
        const cached = compileCache[key];
        if (cached) {
            return cached;
        }
        if (template[0] === '#') {
            const el = document.querySelector(template);
            if (!el) {
                warn(`Template element not found or is empty: ${template}`);
            }
            // __UNSAFE__
            // Reason: potential execution of JS expressions in in-DOM template.
            // The user must make sure the in-DOM template is trusted. If it's rendered
            // by the server, the template should not contain any user data.
            template = el ? el.innerHTML : ``;
        }
        const { code } = compile$1(template, extend({
            hoistStatic: true,
            onError(err) {
                {
                    const message = `Template compilation error: ${err.message}`;
                    const codeFrame = err.loc &&
                        generateCodeFrame(template, err.loc.start.offset, err.loc.end.offset);
                    warn(codeFrame ? `${message}\n${codeFrame}` : message);
                }
            }
        }, options));
        // The wildcard import results in a huge object with every export
        // with keys that cannot be mangled, and can be quite heavy size-wise.
        // In the global build we know `Vue` is available globally so we can avoid
        // the wildcard object.
        const render = (new Function(code)()
        );
        render._rc = true;
        return (compileCache[key] = render);
    }
    registerRuntimeCompiler(compileToFunction);

    exports.BaseTransition = BaseTransition;
    exports.Comment = Comment;
    exports.Fragment = Fragment;
    exports.KeepAlive = KeepAlive;
    exports.Static = Static;
    exports.Suspense = Suspense;
    exports.Teleport = Teleport;
    exports.Text = Text;
    exports.Transition = Transition;
    exports.TransitionGroup = TransitionGroup;
    exports.callWithAsyncErrorHandling = callWithAsyncErrorHandling;
    exports.callWithErrorHandling = callWithErrorHandling;
    exports.camelize = camelize;
    exports.capitalize = capitalize;
    exports.cloneVNode = cloneVNode;
    exports.compile = compileToFunction;
    exports.computed = computed$1;
    exports.createApp = createApp;
    exports.createBlock = createBlock;
    exports.createCommentVNode = createCommentVNode;
    exports.createHydrationRenderer = createHydrationRenderer;
    exports.createRenderer = createRenderer;
    exports.createSSRApp = createSSRApp;
    exports.createSlots = createSlots;
    exports.createStaticVNode = createStaticVNode;
    exports.createTextVNode = createTextVNode;
    exports.createVNode = createVNode;
    exports.customRef = customRef;
    exports.defineAsyncComponent = defineAsyncComponent;
    exports.defineComponent = defineComponent;
    exports.defineEmit = defineEmit;
    exports.defineProps = defineProps;
    exports.getCurrentInstance = getCurrentInstance;
    exports.getTransitionRawChildren = getTransitionRawChildren;
    exports.h = h;
    exports.handleError = handleError;
    exports.hydrate = hydrate;
    exports.initCustomFormatter = initCustomFormatter;
    exports.inject = inject;
    exports.isProxy = isProxy;
    exports.isReactive = isReactive;
    exports.isReadonly = isReadonly;
    exports.isRef = isRef;
    exports.isRuntimeOnly = isRuntimeOnly;
    exports.isVNode = isVNode;
    exports.markRaw = markRaw;
    exports.mergeProps = mergeProps;
    exports.nextTick = nextTick;
    exports.onActivated = onActivated;
    exports.onBeforeMount = onBeforeMount;
    exports.onBeforeUnmount = onBeforeUnmount;
    exports.onBeforeUpdate = onBeforeUpdate;
    exports.onDeactivated = onDeactivated;
    exports.onErrorCaptured = onErrorCaptured;
    exports.onMounted = onMounted;
    exports.onRenderTracked = onRenderTracked;
    exports.onRenderTriggered = onRenderTriggered;
    exports.onUnmounted = onUnmounted;
    exports.onUpdated = onUpdated;
    exports.openBlock = openBlock;
    exports.popScopeId = popScopeId;
    exports.provide = provide;
    exports.proxyRefs = proxyRefs;
    exports.pushScopeId = pushScopeId;
    exports.queuePostFlushCb = queuePostFlushCb;
    exports.reactive = reactive;
    exports.readonly = readonly;
    exports.ref = ref;
    exports.registerRuntimeCompiler = registerRuntimeCompiler;
    exports.render = render;
    exports.renderList = renderList;
    exports.renderSlot = renderSlot;
    exports.resolveComponent = resolveComponent;
    exports.resolveDirective = resolveDirective;
    exports.resolveDynamicComponent = resolveDynamicComponent;
    exports.resolveTransitionHooks = resolveTransitionHooks;
    exports.setBlockTracking = setBlockTracking;
    exports.setDevtoolsHook = setDevtoolsHook;
    exports.setTransitionHooks = setTransitionHooks;
    exports.shallowReactive = shallowReactive;
    exports.shallowReadonly = shallowReadonly;
    exports.shallowRef = shallowRef;
    exports.ssrContextKey = ssrContextKey;
    exports.ssrUtils = ssrUtils;
    exports.toDisplayString = toDisplayString;
    exports.toHandlerKey = toHandlerKey;
    exports.toHandlers = toHandlers;
    exports.toRaw = toRaw;
    exports.toRef = toRef;
    exports.toRefs = toRefs;
    exports.transformVNodeArgs = transformVNodeArgs;
    exports.triggerRef = triggerRef;
    exports.unref = unref;
    exports.useContext = useContext;
    exports.useCssModule = useCssModule;
    exports.useCssVars = useCssVars;
    exports.useSSRContext = useSSRContext;
    exports.useTransitionState = useTransitionState;
    exports.vModelCheckbox = vModelCheckbox;
    exports.vModelDynamic = vModelDynamic;
    exports.vModelRadio = vModelRadio;
    exports.vModelSelect = vModelSelect;
    exports.vModelText = vModelText;
    exports.vShow = vShow;
    exports.version = version;
    exports.warn = warn;
    exports.watch = watch;
    exports.watchEffect = watchEffect;
    exports.withCtx = withCtx;
    exports.withDirectives = withDirectives;
    exports.withKeys = withKeys;
    exports.withModifiers = withModifiers;
    exports.withScopeId = withScopeId;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

}({}));