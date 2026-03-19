// schema/pole.js  (杆塔示例)
export default {
  deviceType: 'pole',
  label: '杆塔',
  icon: '/static/icons/pole.png',
  category: '10kV',          // 所属分类，用于"+"菜单分组
  fields: [
    {
      key: 'pole_number',
      label: '杆塔编号',
      type: 'text',
      required: true,
      placeholder: '请输入杆塔编号',
      exportOrder: 1,
      exportLabel: '杆塔编号'
    },
    {
      key: 'pole_type',
      label: '杆型',
      type: 'radio',
      required: true,
      options: [
        { label: '直线杆', value: 'straight' },
        { label: '耐张杆', value: 'tension' },
        { label: '转角杆', value: 'corner' }
      ],
      exportOrder: 2,
      exportLabel: '杆型'
    },
    {
      key: 'material',
      label: '杆材',
      type: 'radio',
      options: [
        { label: '水泥杆', value: 'concrete' },
        { label: '铁塔', value: 'steel' },
        { label: '木杆', value: 'wood' }
      ],
      exportOrder: 3,
      exportLabel: '杆材'
    },
    {
      key: 'height',
      label: '杆高(m)',
      type: 'number',
      placeholder: '请输入',
      exportOrder: 4,
      exportLabel: '杆高(m)'
    },
    {
      key: 'remark',
      label: '备注',
      type: 'textarea',
      maxLength: 200,
      exportOrder: 99,
      exportLabel: '备注'
    }
  ],
  photoSlots: [
    { key: 'overview', label: '全景照', required: true, max: 2 },
    { key: 'nameplate', label: '铭牌照', required: false, max: 1 }
  ]
}