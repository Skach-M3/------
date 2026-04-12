//schema/index.js
/**
 * Schema 注册中心
 * 所有设备类型的 schema 在此集中注册，
 * 通过 getSchema(deviceType) 按需获取
 */

import poleSchema from './pole.js'
import poleSwitchgearSchema from './poleSwitchgear.js'
import cableTurningingPointSchema from './cableTurningPoint.js'
import transformSchema from './transformer.js'
import meterSchema from './meter.js'
import stationSchema from './station.js'
import stationSwitchgearSchema from './stationSwitchgear.js'
import subStationSchema from './subStation.js'

const schemas = {
    pole: poleSchema,
    pole_switchgear: poleSwitchgearSchema,
    cable_turning_point: cableTurningingPointSchema,
    transformer: transformSchema,
    meter: meterSchema,
    station: stationSchema,
    station_switchgear: stationSwitchgearSchema,
    substation: subStationSchema,
    // wire: wireSchema,
    // switch: switchSchema,
}

/**
 * 根据设备类型获取 schema
 * @param {string} deviceType - 设备类型标识，如 'pole'、'wire'
 * @returns {Object} schema 定义
 */
export function getSchema(deviceType) {
    const schema = schemas[deviceType]
    if (!schema) {
        console.warn(`[schema] 未找到类型 "${deviceType}" 的 schema 定义`)
        return {
            label: '未知设备',
            nameField: '',
            fields: [],
            children: []
        }
    }
    return schema
}