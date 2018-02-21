(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.ellipsis = factory());
}(this, (function () { 'use strict';

// const getLengthByCanvas = (ctx, font = {}) => {
//     const weight = font.fontWeight;
//     const size = font.fontSize;
//     const family = font.fontFamily;
//     ctx.font = `${weight} ${size} ${family}`;

//     return ctx.measureText(font.value).width;
// };
var getLengthByDom = function getLengthByDom(span) {
    var font = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    span.innerText = font.value;
    // 因为offsetWidth存在四舍五入 降低精度
    return span.offsetWidth + 0.5;
};

var core = (function () {
    var font = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var span = arguments[1];

    var beginLine = 1;
    var index = 0;
    var line = [];

    for (var i = 0; i <= font.text.length; i++) {
        if (beginLine > font.lineNum) break;
        var left = beginLine === parseInt(font.lineNum, 10) ? font.left : '';
        var str = font.text.substr(index, i - index) + left;
        var len = getLengthByDom(span, Object.assign({ value: str }, font));
        // console.log(str, len);
        if (len <= parseFloat(font.width, 10)) {
            line[beginLine - 1] = str;
        } else {
            i--;
            beginLine++;
            index = i;
        }
    }

    return line;
});

var userConfig = {
    width: '50px',
    lineNum: 2,
    fontFamily: 'microsoft yahei',
    fontWeight: 'bold',
    fontSize: '14px',
    left: '...',
    tagName: 'p',
    isImmediate: true
};

var assignConfig = function assignConfig(conf) {
    Object.assign(userConfig, conf);
};

/* Modified from https://github.com/sdecima/javascript-detect-element-resize
 * version: 0.5.3
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013 Sebastián Décima
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
/* eslint-disable */
var isServer = typeof window === 'undefined';

/* istanbul ignore next */
var requestFrame = function () {
    if (isServer) return;
    var raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function (fn) {
        return window.setTimeout(fn, 20);
    };
    return function (fn) {
        return raf(fn);
    };
}();

/* istanbul ignore next */
var cancelFrame = function () {
    if (isServer) return;
    var cancel = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.clearTimeout;
    return function (id) {
        return cancel(id);
    };
}();

/* istanbul ignore next */
var resetTrigger = function resetTrigger(element) {
    var trigger = element.__resizeTrigger__;
    var expand = trigger.firstElementChild;
    var contract = trigger.lastElementChild;
    var expandChild = expand.firstElementChild;

    contract.scrollLeft = contract.scrollWidth;
    contract.scrollTop = contract.scrollHeight;
    expandChild.style.width = expand.offsetWidth + 1 + 'px';
    expandChild.style.height = expand.offsetHeight + 1 + 'px';
    expand.scrollLeft = expand.scrollWidth;
    expand.scrollTop = expand.scrollHeight;
};

/* istanbul ignore next */
var checkTriggers = function checkTriggers(element) {
    return element.offsetWidth !== element.__resizeLast__.width || element.offsetHeight !== element.__resizeLast__.height;
};

/* istanbul ignore next */
var scrollListener = function scrollListener(event) {
    var _this = this;

    resetTrigger(this);
    if (this.__resizeRAF__) cancelFrame(this.__resizeRAF__);
    this.__resizeRAF__ = requestFrame(function () {
        if (checkTriggers(_this)) {
            _this.__resizeLast__.width = _this.offsetWidth;
            _this.__resizeLast__.height = _this.offsetHeight;
            _this.__resizeListeners__.forEach(function (fn) {
                fn.call(_this, event);
            });
        }
    });
};

/* Detect CSS Animations support to detect element display/re-attach */
var attachEvent = isServer ? {} : document.attachEvent;
var DOM_PREFIXES = 'Webkit Moz O ms'.split(' ');
var START_EVENTS = 'webkitAnimationStart animationstart oAnimationStart MSAnimationStart'.split(' ');
var RESIZE_ANIMATION_NAME = 'resizeanim';
var animation = false;
var keyFramePrefix = '';
var animationStartEvent = 'animationstart';

/* istanbul ignore next */
if (!attachEvent && !isServer) {
    var testElement = document.createElement('fakeelement');
    if (testElement.style.animationName !== undefined) {
        animation = true;
    }

    if (animation === false) {
        var prefix = '';
        for (var i = 0; i < DOM_PREFIXES.length; i++) {
            if (testElement.style[DOM_PREFIXES[i] + 'AnimationName'] !== undefined) {
                prefix = DOM_PREFIXES[i];
                keyFramePrefix = '-' + prefix.toLowerCase() + '-';
                animationStartEvent = START_EVENTS[i];
                animation = true;
                break;
            }
        }
    }
}

var stylesCreated = false;
/* istanbul ignore next */
var createStyles = function createStyles() {
    if (!stylesCreated && !isServer) {
        var animationKeyframes = '@' + keyFramePrefix + 'keyframes ' + RESIZE_ANIMATION_NAME + ' { from { opacity: 0; } to { opacity: 0; } } ';
        var animationStyle = keyFramePrefix + 'animation: 1ms ' + RESIZE_ANIMATION_NAME + ';';

        // opacity: 0 works around a chrome bug https://code.google.com/p/chromium/issues/detail?id=286360
        var css = animationKeyframes + '\n      .resize-triggers { ' + animationStyle + ' visibility: hidden; opacity: 0; }\n      .resize-triggers, .resize-triggers > div, .contract-trigger:before { content: " "; display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; z-index: -1 }\n      .resize-triggers > div { background: #eee; overflow: auto; }\n      .contract-trigger:before { width: 200%; height: 200%; }';

        var head = document.head || document.getElementsByTagName('head')[0];
        var style = document.createElement('style');

        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else {
            style.appendChild(document.createTextNode(css));
        }

        head.appendChild(style);
        stylesCreated = true;
    }
};

/* istanbul ignore next */
var addResizeListener = function addResizeListener(element, fn) {
    if (isServer) return;
    if (attachEvent) {
        element.attachEvent('onresize', fn);
    } else {
        if (!element.__resizeTrigger__) {
            if (getComputedStyle(element).position === 'static') {
                element.style.position = 'relative';
            }
            createStyles();
            element.__resizeLast__ = {};
            element.__resizeListeners__ = [];

            var resizeTrigger = element.__resizeTrigger__ = document.createElement('div');
            resizeTrigger.className = 'resize-triggers';
            resizeTrigger.innerHTML = '<div class="expand-trigger"><div></div></div><div class="contract-trigger"></div>';
            element.appendChild(resizeTrigger);

            resetTrigger(element);
            element.addEventListener('scroll', scrollListener, true);

            /* Listen for a css animation to detect element display/re-attach */
            if (animationStartEvent) {
                resizeTrigger.addEventListener(animationStartEvent, function (event) {
                    if (event.animationName === RESIZE_ANIMATION_NAME) {
                        resetTrigger(element);
                    }
                });
            }
        }
        element.__resizeListeners__.push(fn);
    }
};

/* istanbul ignore next */
var removeResizeListener = function removeResizeListener(element, fn) {
    if (!element || !element.__resizeListeners__) return;
    if (attachEvent) {
        element.detachEvent('onresize', fn);
    } else {
        element.__resizeListeners__.splice(element.__resizeListeners__.indexOf(fn), 1);
        if (!element.__resizeListeners__.length) {
            element.removeEventListener('scroll', scrollListener);
            element.__resizeTrigger__ = !element.removeChild(element.__resizeTrigger__);
        }
    }
};

var Ellipsis = {
    name: 'ellipsis',
    props: {
        text: {
            type: String,
            default: ''
        },
        width: {
            type: String
        },
        //lineHeight: {
        //    type: String,
        //    default: '14px',
        //},
        lineNum: {
            type: Number
        },
        fontFamily: {
            type: String
        },
        fontWeight: {
            type: String | Number
        },
        fontSize: {
            type: String
        },
        left: {
            type: String
        },
        tagName: {
            type: String,
            default: userConfig.tagName
        },
        isImmediate: {
            type: Boolean,
            default: userConfig.isImmediate
        },
        collapsed: {
            type: Boolean,
            default: true
        }
    },
    data: function data() {
        return {
            textArr: [],
            span: '',
            parentWidth: '',
            resizeEvent: ''
        };
    },
    render: function render() {
        var _this = this;

        var h = arguments[0];

        var item = this.textArr.map(function (item) {
            return h(
                _this.tagName,
                { 'class': 'ellipsis' },
                [item]
            );
        });
        return h(
            'div',
            null,
            [item]
        );
    },

    watch: {
        width: function width() {
            this.update();
        },
        text: function text() {
            this.update();
        },
        collapsed: function collapsed() {
            this.update();
        }
    },
    methods: {
        init: function init() {
            // 初始化
            if (this.collapsed) {
                this.span = document.createElement('span');
                this.span.style.opacity = 0;
                this.span.style['white-space'] = 'nowrap';
                this.span.style['font-weight'] = this.fontWeight || userConfig.fontWeight;
                this.span.style['font-family'] = this.fontFamily || userConfig.fontFamily;
                this.span.style['font-size'] = this.fontSize || userConfig.fontSize;
                document.body.append(this.span);
                var font = {
                    text: this.text,
                    width: this.parentWidth || parseFloat(getComputedStyle(this.$el.parentElement).width, 10),
                    lineHeight: this.lineHeight || userConfig.lineHeight,
                    lineNum: this.lineNum || userConfig.lineNum,
                    fontFamily: this.fontFamily || userConfig.fontFamily,
                    fontSize: this.fontSize || userConfig.fontSize,
                    fontWeight: this.fontWeight || userConfig.fontWeight,
                    left: this.left || userConfig.left
                };
                this.textArr = core(font, this.span);
            } else {
                this.textArr = [this.text];
            }
            this.destory();
        },
        destory: function destory() {
            if (this.span.remove) {
                this.span.remove();
            }
            this.span = '';
        },
        update: function update() {
            this.init();
        }
    },
    beforeMount: function beforeMount() {
        if (this.width) {
            this.parentWidth = this.width;
            this.init();
        }
    },
    mounted: function mounted() {
        var _this2 = this;

        if (!this.width) {
            this.parentWidth = parseFloat(getComputedStyle(this.$el.parentElement).width, 10);
            this.init();
            var min = 1000;
            var timeout = void 0;
            var begin = new Date().getTime();
            var that = this;
            this.resizeEvent = function () {
                if (that.parentWidth === parseFloat(getComputedStyle(_this2.$el.parentElement).width, 10)) return;
                that.parentWidth = parseFloat(getComputedStyle(_this2.$el.parentElement).width, 10);
                if (that.isImmediate) {
                    that.init();
                } else {
                    var now = new Date().getTime();
                    if (now - begin < min) {
                        timeout = setTimeout(function () {
                            that.init.call(that);
                            begin = now;
                        }, now - begin);
                    } else {
                        timeout = null;
                        clearTimeout(timeout);
                        that.init();
                        begin = now;
                    }
                }
            };
            addResizeListener(this.$el, this.resizeEvent);
        }
    },
    destroyed: function destroyed() {
        removeResizeListener(this.$el, this.resizeEvent);
    }
};

var install = function install(Vue, conf) {
    Vue.component(Ellipsis.name, Ellipsis);
    if (conf) {
        assignConfig(conf);
    }
};

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}

var index_global = {
    install: install,
    Ellipsis: Ellipsis
};
// module.exports = {
//    install
// };

return index_global;

})));
//# sourceMappingURL=ellipsis.js.map
