// schema/substation.js — 变电站
export default {
    deviceType: 'substation',
    label: '变电站',
    icon: '/static/icons/substation.png',
    category: '变电站',
    nameField: 'substation_name',

    // ===== 层级关系 =====
    parentDeviceType: null,                // 一级设备，无父设备
    isAvailablePreNode: true,
    isPreNodeEditable: true,

    fields: [
        // ===== 基础信息 =====
        {
            key: 'substation_name',
            label: '变电站名称',
            type: 'composite-name',
            required: true,
            placeholder: '请输入变电站名称',
            exportOrder: 1,
            exportLabel: '变电站名称'
        },
        {
            key: 'voltage_level',
            label: '电压等级',
            type: 'select',
            required: true,
            options: [
                { label: '6kV', value: '6kV' },
                { label: '10kV', value: '10kV' },
                { label: '35kV', value: '35kV' },
                { label: '66kV', value: '66kV' },
                { label: '110kV', value: '110kV' },
                { label: '220kV', value: '220kV' },
                { label: '330kV', value: '330kV' },
                { label: '500kV', value: '500kV' }
            ],
            exportOrder: 2,
            exportLabel: '电压等级'
        },
        {
            key: 'belong_busbar',
            label: '所属母线',
            type: 'text',
            required: false,
            placeholder: '请输入所属母线',
            exportOrder: 3,
            exportLabel: '所属母线'
        },
        {
            key: 'remark_1',
            label: '备注(1)',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 4,
            exportLabel: '备注1'
        },
        {
            key: 'remark_2',
            label: '备注(2)',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 5,
            exportLabel: '备注2'
        },
        {
            key: 'longitude',
            label: '经度',
            type: 'auto-calc',
            calcType: '',
            decimal: 8,
            editable: false,
            exportOrder: 6,
            exportLabel: '经度'
        },
        {
            key: 'latitude',
            label: '纬度',
            type: 'auto-calc',
            calcType: '',
            decimal: 8,
            editable: false,
            exportOrder: 7,
            exportLabel: '纬度'
        }
    ],

    // ===== 照片 =====
    photoSlots: [
        { key: 'full_view', label: '全貌', required: true }
    ],
    extraPhotoSlot: true
}