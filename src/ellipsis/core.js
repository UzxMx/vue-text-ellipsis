// const getLengthByCanvas = (ctx, font = {}) => {
//     const weight = font.fontWeight;
//     const size = font.fontSize;
//     const family = font.fontFamily;
//     ctx.font = `${weight} ${size} ${family}`;

//     return ctx.measureText(font.value).width;
// };
const getLengthByDom = (span, font = {}) => {
    span.innerText = font.value;
    // 因为offsetWidth存在四舍五入 降低精度
    return span.offsetWidth + 0.5;
};

export default (font = {}, span) => {
    let beginLine = 1;
    let index = 0;
    const line = [];

    for (let i = 0; i <= font.text.length; i++) {
        if (beginLine > font.lineNum) break;
        const left = beginLine === parseInt(font.lineNum, 10) ? font.left : '';
        const str = font.text.substr(index, i - index) + left;
        const len = getLengthByDom(
            span,
            Object.assign({ value: str }, font),
        );
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
};
