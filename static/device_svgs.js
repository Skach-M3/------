/**
 * 设备类型 SVG 图标集合
 * - mapSvg:  用于地图 marker 内嵌（HTML 字符串，白色填充/描边）
 * - pinSvg:  用于移动模式十字准星中心图标（可被转为 data URI）
 *
 * 如果两者一致，pinSvg 可省略，运行时回退到 mapSvg。
 */

// -------- 地图 Marker 内嵌 SVG（HTML 字符串） --------
export const MAP_SVGS = {
    pole:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 162 148" width="16" height="16">'
        + '<path fill="#fff" d="'
        + 'M150,90.9C144.1,114.3,130.1,130.5,108.5,139.7C97.5,144.3,85.9,145.9,73.7,144.3'
        + 'C61.5,142.7,50.6,138.6,41,131.4C25.1,119.7,15.7,104.1,12.9,84.3'
        + 'C10.1,65.1,14.9,47.7,26.4,32.7C37.8,17.7,53.3,8.4,72.7,5.8'
        + 'C91.4,3.4,108.1,7.7,123.1,18.6C138.9,30.2,148.4,45.7,151.2,65.5'
        + 'C152.4,74,151.8,82.2,150,90.9'
        + 'M104.5,55.1C99.4,61,94.2,67,88.7,73.4C100.6,86.3,112.4,99.1,124.3,112'
        + 'C145.6,88.7,141,51.4,121.9,36.4C116.2,42.4,110.6,48.5,104.5,55.1'
        + 'M32.1,48.7C21.4,70.8,24.2,94.5,39.9,111.8C51.4,99.1,63,86.4,75,73.2'
        + 'C63.9,60.8,52.9,48.5,41.3,35.5C38.1,40,35.3,44,32.1,48.7'
        + 'M52.1,113.7C50.7,115.5,49.4,117.3,48,119C63.1,134.4,97.9,136.3,116.2,119.2'
        + 'C110.7,112.8,105.2,106.4,99.6,100.1C93.9,93.8,88,87.5,81.8,80.8'
        + 'C72,91.6,62.3,102.3,52.1,113.7'
        + 'M89,57.5C97.3,48,105.6,38.5,113.9,28.9C95.9,14.7,64.7,15.9,50.1,29.3'
        + 'C60.6,41.3,71.1,53.3,81.9,65.8C84.5,62.7,86.5,60.4,89,57.5z" />'
        + '</svg>',

    transformer:
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
        + '<circle cx="9" cy="12" r="5" stroke="#fff" stroke-width="1.5" />'
        + '<circle cx="15" cy="12" r="5" stroke="#fff" stroke-width="1.5" />'
        + '</svg>',

    substation:
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
        + '<rect x="4" y="9" width="16" height="11" rx="1" stroke="#fff" stroke-width="1.5" />'
        + '<path d="M4 9l8-5 8 5" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" />'
        + '<path d="M13 12l-2 3.5h3l-2 3.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />'
        + '</svg>',

    cable_turning_point:
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
        + '<circle cx="12" cy="12" r="3" fill="#fff" />'
        + '<path d="M4 12h5M15 12h5M12 4v5M12 15v5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />'
        + '</svg>',

    meter:
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
        + '<circle cx="12" cy="13" r="8" stroke="#fff" stroke-width="1.5" />'
        + '<path d="M12 13l4-4" stroke="#fff" stroke-width="2" stroke-linecap="round" />'
        + '<circle cx="12" cy="13" r="1.5" fill="#fff" />'
        + '</svg>',

    station:
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none">'
        + '<path d="M3 12l9-7 9 7" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />'
        + '<rect x="5" y="12" width="14" height="8" stroke="#fff" stroke-width="1.5" />'
        + '<rect x="9" y="15" width="6" height="5" stroke="#fff" stroke-width="1.5" />'
        + '</svg>'
};

// -------- 移动模式 Pin SVG（用于 data URI，viewBox 16x16） --------
// 部分图标和 MAP_SVGS 一致，单独列出是为了可以独立定制尺寸/颜色
export const PIN_SVGS = {
    substation:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        + '<path d="M9.5 1L4 9h4l-1 6 5.5-8H8.5z" fill="white"/></svg>',

    pole: MAP_SVGS.pole, // 复用

    cable_turning_point:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        + '<circle cx="8" cy="8" r="2" fill="white"/>'
        + '<path d="M2 8h4M10 8h4M8 2v4M8 10v4" stroke="white" stroke-width="1.2" stroke-linecap="round"/></svg>',

    transformer:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        + '<circle cx="6.5" cy="8" r="3" stroke="white" stroke-width="1.2" fill="none"/>'
        + '<circle cx="9.5" cy="8" r="3" stroke="white" stroke-width="1.2" fill="none"/></svg>',

    meter:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        + '<circle cx="8" cy="8" r="5" stroke="white" stroke-width="1.2" fill="none"/>'
        + '<path d="M8 5v3l2 2" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',

    station:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">'
        + '<path d="M3 14V7l5-4 5 4v7H3z" stroke="white" stroke-width="1.2" fill="none" stroke-linejoin="round"/>'
        + '<path d="M7 14v-4h2v4" stroke="white" stroke-width="1" fill="none"/></svg>'
};

// 默认兜底图标
export const DEFAULT_SVG =
    '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="6" fill="#fff" /></svg>';

/**
 * 获取地图 Marker 用的 SVG HTML
 */
export function getMapSvg(deviceType) {
    return MAP_SVGS[deviceType] || DEFAULT_SVG;
}

/**
 * 获取移动模式 Pin 用的 SVG data URI
 */
export function getPinSvgUri(deviceType) {
    var svg = PIN_SVGS[deviceType] || DEFAULT_SVG;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}