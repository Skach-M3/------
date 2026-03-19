// schema/registry.js
import pole from './pole'

// ... 后续设备一行一行加

const schemaMap = {}
const schemaList = []

function register(schema) {
  schemaMap[schema.deviceType] = schema
  schemaList.push(schema)
}

register(pole)

// register(cableWell)
// register(switchStation)
// ... 有一个加一个

export function getSchema(deviceType) {
  return schemaMap[deviceType] || null
}

export function getAllSchemas() {
  return schemaList
}

export function getSchemasByCategory(category) {
  return schemaList.filter(s => s.category === category)
}