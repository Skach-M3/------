/**
 * 设备类型 SVG 图标集合
 * - mapSvg:  用于地图 marker 内嵌（HTML 字符串，白色填充/描边）
 * - pinSvg:  用于移动模式十字准星中心图标（可被转为 data URI）
 *
 * 如果两者一致，pinSvg 可省略，运行时回退到 mapSvg。
 */

// -------- 地图 Marker 内嵌 SVG（HTML 字符串） --------
export const MAP_SVGS = {
    // 杆塔
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

    // 变压器
    transformer:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="16" height="16" fill="none">'
        + '<circle cx="70" cy="50" r="40" stroke="#fff" stroke-width="15" fill="none"/>'
        + '<circle cx="130" cy="50" r="40" stroke="#fff" stroke-width="15" fill="none"/>'
        + '<rect x="00" y="42.5" width="30" height="15" rx="7.5" fill="#fff"/>'
        + '<rect x="170" y="42.5" width="30" height="15" rx="7.5" fill="#fff"/>'
        + '</svg>',

    // 变电站
    substation:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="16" height="16" fill="none">'
        + '<circle cx="50" cy="50" r="45" stroke="#fff" stroke-width="8" fill="none"/>'
        + '<circle cx="50" cy="50" r="30" stroke="#fff" stroke-width="8" fill="none"/>'
        + '<circle cx="50" cy="50" r="15" fill="#fff"/>'
        + '</svg>',

    // 电缆拐点
    cable_turning_point:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 407 387" width="16" height="16">'
        + '<path fill="#fff" d="M235.7,97.3C242.6,109.2,249.2'
        + '120.7,255.8,132.3C264.2,146.9,272.6,161.6,281,176.2C291.3,193.9,301.6,211.6,311.8,229.3C320.2,243.9'
        + '328.6,258.6,337,273.2C347.3,290.9,357.6,308.6,367.8,326.3C373.2,335.6,378.5,344.8,384.1,354.5C261.7'
        + '354.5,139.6,354.5,16.9,354.5C78,248.7,139,143,200.5,36.5C212.3,57,223.9,77,235.7,97.3Z"/>'
        + '</svg>',

    // 计量信息
    meter:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="16" height="16">'
        + '<path d="M10 10h180v180H10z M30 30h140v140H30z" fill="#fff" fill-rule="evenodd"/>'
        + '<text x="100" y="130" font-family="Times New Roman, serif" font-size="110" font-weight="bold" fill="#fff" text-anchor="middle">JL</text>'
        + '</svg>',

    // 站房
    station:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="16" height="16">'
        + '<path d="M10 10h180v180H10z M30 30h140v140H30z" fill="#fff" fill-rule="evenodd"/>'
        + '<text x="100" y="135" font-family="Times New Roman, serif" font-size="110" font-weight="bold" fill="#fff" text-anchor="middle">ZF</text>'
        + '</svg>',

    // 问题设备
    question:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="16" height="16">'
        + '<polygon points="50,10 92,85 8,85" fill="#f9e51c" stroke="#f9e51c" stroke-width="10" stroke-linejoin="round"/>'
        + '<polygon points="50,10 92,85 8,85" fill="none" stroke="#1C1917" stroke-width="9" stroke-linejoin="round" style="transform: scale(0.88); transform-origin: 50px 60px;"/>'
        + '<g style="transform: translate(0px, 5px) scale(0.86); transform-origin: 50px 50px;" fill="#1C1917">'
        + '<path d="M 45 32 A 5 5 0 0 1 55 32 L 53 59 A 3 3 0 0 1 47 59 Z"/>'
        + '<circle cx="50" cy="68" r="4.5"/>'
        + '</g>'
        + '</svg>'
};

// -------- 移动模式 Pin SVG（用于 data URI，viewBox 16x16） --------
// 部分图标和 MAP_SVGS 一致，单独列出是为了可以独立定制尺寸/颜色
export const PIN_SVGS = {
    substation: MAP_SVGS.substation,

    pole: MAP_SVGS.pole, // 复用

    cable_turning_point: MAP_SVGS.cable_turning_point,

    transformer: MAP_SVGS.transformer,

    meter: MAP_SVGS.meter,

    station: MAP_SVGS.station,

    question: MAP_SVGS.question,
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