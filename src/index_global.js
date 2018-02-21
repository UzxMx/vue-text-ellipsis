import Ellipsis from './ellipsis/ellipsis.vue';
import { assignConfig } from './ellipsis/config';

const install = (Vue, conf) => {
    Vue.component(Ellipsis.name, Ellipsis);
    if (conf) {
        assignConfig(conf);
    }
};

/* istanbul ignore if */
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}

export default {
    install,
    Ellipsis
};
// module.exports = {
//    install
// };
