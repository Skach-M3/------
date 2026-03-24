// schema/registry.js
import pole from './pole'
import poleSwitchgear from './poleSwitchgear'

const schemaMap = {}
const schemaList = []

function register(schema) {
  schemaMap[schema.deviceType] = schema
  schemaList.push(schema)
}

register(pole)
register(poleSwitchgear)

export function getSchema(deviceType) {
  return schemaMap[deviceType] || null
}

export function getAllSchemas() {
  return schemaList
}

export function getSchemasByCategory(category) {
  return schemaList.filter(s => s.category === category)
}

// 获取所有主设备（非子设备），用于FAB菜单
export function getMainSchemas() {
  return schemaList.filter(s => !s.isChild)
}

// 获取某个父设备类型下可挂载的子设备schema
export function getChildSchemas(parentDeviceType) {
  return schemaList.filter(s => s.isChild && s.parentTypes && s.parentTypes.includes(parentDeviceType))
}