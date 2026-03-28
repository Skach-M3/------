// schema/pole.js — 杆塔完整字段定义
export default {
  deviceType: 'pole',
  label: '杆塔',
  icon: '/static/icons/pole.png',
  category: '10kV',
  nameField: 'pole_name',   // 该字段的值会同步写入 t_device.name
  children: ['pole_switchgear'],  // 可挂载的子设备类型

  fields: [
    // ===== 基础信息 =====
    {
      key: 'pole_name',
      label: '杆塔名称',
      group: '基础信息',
      type: 'text',
      required: true,
      prefix: '10kV',
      suffix: '杆',
      autoIncrement: true,
      placeholder: '输入中间部分，如：XX路',
      exportOrder: 1,
      exportLabel: '杆塔名称'
    },
    {
      key: 'pole_height',
      label: '杆塔高/m',
      group: '基础信息',
      type: 'number',
      placeholder: '请输入杆塔高度',
      exportOrder: 2,
      exportLabel: '杆塔高/m'
    },
    {
      key: 'pole_material',
      label: '杆塔材质',
      group: '基础信息',
      type: 'select',
      required: true,
      options: [
        { label: '水泥杆', value: '水泥杆' },
        { label: '钢管杆', value: '钢管杆' },
        { label: '角钢塔', value: '角钢塔' },
        { label: '钢管塔', value: '钢管塔' },
        { label: '铁杆', value: '铁杆' },
        { label: '木杆', value: '木杆' }
      ],
      exportOrder: 3,
      exportLabel: '杆塔材质'
    },
    {
      key: 'pole_nature',
      label: '杆塔性质',
      group: '基础信息',
      type: 'select',
      required: true,
      options: [
        { label: '直线', value: '直线' },
        { label: '耐张', value: '耐张' },
        { label: '起点', value: '起点' },
        { label: '终点', value: '终点' }
      ],
      exportOrder: 4,
      exportLabel: '杆塔性质'
    },

    // ===== 导线信息 =====
    {
      key: 'wire_arrangement',
      label: '导线排列方式',
      group: '导线信息',
      type: 'select',
      options: [
        { label: '水平', value: '水平' },
        { label: '三角', value: '三角' },
        { label: '垂直', value: '垂直' }
      ],
      exportOrder: 5,
      exportLabel: '导线排列方式'
    },
    {
      key: 'wire_erection_way',
      label: '导线架设方式',
      group: '导线信息',
      type: 'select',
      options: [
        { label: '架空', value: '架空' },
        { label: '地埋', value: '地埋' },
        { label: '屋顶', value: '屋顶' },
        { label: '悬挂', value: '悬挂' }
      ],
      exportOrder: 6,
      exportLabel: '导线架设方式'
    },
    {
      key: 'wire_circuit_count',
      label: '导线回路数',
      group: '导线信息',
      type: 'select',
      options: [
        { label: '单回', value: '单回' },
        { label: '双回', value: '双回' },
        { label: '三回', value: '三回' },
        { label: '四回', value: '四回' },
        { label: '五回', value: '五回' },
        { label: '六回', value: '六回' },
        { label: '其他', value: '其他' }
      ],
      exportOrder: 7,
      exportLabel: '导线回路数'
    },
    {
      key: 'wire_circuit_position',
      label: '导线回路位置',
      group: '导线信息',
      type: 'select',
      options: [
        { label: '中回', value: '中回' },
        { label: '左回', value: '左回' },
        { label: '右回', value: '右回' },
        { label: '上回', value: '上回' },
        { label: '下回', value: '下回' },
        { label: '左上回', value: '左上回' },
        { label: '左下回', value: '左下回' },
        { label: '右上回', value: '右上回' },
        { label: '右下回', value: '右下回' },
        { label: '其他', value: '其他' }
      ],
      exportOrder: 8,
      exportLabel: '导线回路位置'
    },
    {
      key: 'wire_type',
      label: '导线类型',
      group: '导线信息',
      type: 'select',
      options: [
        { label: '绝缘导线', value: '绝缘导线' },
        { label: '裸导线', value: '裸导线' },
        { label: '电缆', value: '电缆' }
      ],
      exportOrder: 9,
      exportLabel: '导线类型'
    },
    {
      key: 'wire_model',
      label: '导线型号截面',
      group: '导线信息',
      type: 'cascading-select',
      dependsOn: 'wire_type',
      allowCustom: true,
      optionsMap: {
        '绝缘导线': [
          { label: 'JKLYJ-10kV-50', value: 'JKLYJ-10kV-50' },
          { label: 'JKLYJ-10kV-70', value: 'JKLYJ-10kV-70' },
          { label: 'JKLYJ-10kV-95', value: 'JKLYJ-10kV-95' },
          { label: 'JKLYJ-10kV-120', value: 'JKLYJ-10kV-120' },
          { label: 'JKLYJ-10kV-150', value: 'JKLYJ-10kV-150' },
          { label: 'JKLYJ-10kV-185', value: 'JKLYJ-10kV-185' },
          { label: 'JKLYJ-10kV-240', value: 'JKLYJ-10kV-240' }
        ],
        '裸导线': [
          { label: 'LGJ-50/8', value: 'LGJ-50/8' },
          { label: 'LGJ-70/10', value: 'LGJ-70/10' },
          { label: 'LGJ-95/15', value: 'LGJ-95/15' },
          { label: 'LGJ-120/20', value: 'LGJ-120/20' },
          { label: 'LGJ-150/20', value: 'LGJ-150/20' },
          { label: 'LGJ-185/25', value: 'LGJ-185/25' },
          { label: 'LGJ-240/30', value: 'LGJ-240/30' }
        ],
        '电缆': [
          { label: 'YJV22-8.7/15kV-3×50', value: 'YJV22-8.7/15kV-3×50' },
          { label: 'YJV22-8.7/15kV-3×70', value: 'YJV22-8.7/15kV-3×70' },
          { label: 'YJV22-8.7/15kV-3×95', value: 'YJV22-8.7/15kV-3×95' },
          { label: 'YJV22-8.7/15kV-3×120', value: 'YJV22-8.7/15kV-3×120' },
          { label: 'YJV22-8.7/15kV-3×150', value: 'YJV22-8.7/15kV-3×150' },
          { label: 'YJV22-8.7/15kV-3×185', value: 'YJV22-8.7/15kV-3×185' },
          { label: 'YJV22-8.7/15kV-3×240', value: 'YJV22-8.7/15kV-3×240' }
        ]
      },
      exportOrder: 10,
      exportLabel: '导线型号截面'
    },

    // ===== 附属设备与其他 =====
    {
      key: 'auxiliary_equipment',
      label: '柱上附属设备',
      group: '附属设备与其他',
      type: 'checkbox',
      options: [
        { label: '故障指示器', value: '故障指示器' },
        { label: '接地环', value: '接地环' },
        { label: '柱上避雷器', value: '柱上避雷器' },
        { label: '其他', value: '其他' }
      ],
      exportOrder: 11,
      exportLabel: '柱上附属设备'
    },
    {
      key: 'remark_1',
      label: '备注1',
      group: '附属设备与其他',
      type: 'textarea',
      maxLength: 500,
      placeholder: '请输入备注',
      exportOrder: 12,
      exportLabel: '备注1'
    },
    {
      key: 'remark_2',
      label: '备注2',
      group: '附属设备与其他',
      type: 'textarea',
      maxLength: 500,
      placeholder: '请输入备注',
      exportOrder: 13,
      exportLabel: '备注2'
    },
    {
      key: 'span_length',
      label: '档距/m',
      group: '附属设备与其他',
      type: 'auto-calc',
      calcType: 'distance_from_prev',
      decimal: 2,
      editable: true,
      exportOrder: 14,
      exportLabel: '档距/m'
    }
  ],

  photoSlots: [
    { key: 'overview', label: '全貌', required: true, max: 3 },
    { key: 'pole_head', label: '杆头', required: false, max: 3 },
    { key: 'nameplate', label: '铭牌', required: false, max: 3 },
    { key: 'wire_load', label: '导线负荷侧', required: false, max: 3 }
  ],
  extraPhotoSlot: true
}