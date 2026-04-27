// schema/cable_turning_point.js — 电缆拐点完整字段定义
export default {
    deviceType: 'cable_turning_point',
    label: '电缆拐点',
    icon: '/static/icons/cable_turning_point.png',
    category: '10kV',
    nameField: 'turning_point_name',
    children: [],
    isAvailablePreNode: true,
    isPreNodeEditable: true,
    preNodeFieldName: '上级节点',

    fields: [
        // ===== 基础信息 =====
        {
            key: 'turning_point_name',
            label: '拐点名称',
            group: '基础信息',
            type: 'composite-name',
            required: true,
            isCopyable: true,
            placeholder: '输入拐点名称',
            exportOrder: 1,
            exportLabel: '拐点名称'
        },
        {
            key: 'turning_point_type',
            label: '拐点类型',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '电缆井', value: '电缆井' },
                { label: '电缆沟', value: '电缆沟' },
                { label: '电缆桩', value: '电缆桩' },
                { label: '虚拟点', value: '虚拟点' }
            ],
            exportOrder: 2,
            exportLabel: '拐点类型'
        },

        // ===== 线缆信息 =====
        {
            key: 'cable_type',
            label: '线缆类型',
            group: '线缆信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '电缆', value: '电缆' }
            ],
            exportOrder: 3,
            exportLabel: '线缆类型'
        },
        {
            key: 'laying_method',
            label: '敷设方式',
            group: '线缆信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '地埋', value: '地埋' },
                { label: '架空', value: '架空' }
            ],
            exportOrder: 4,
            exportLabel: '敷设方式'
        },
        {
            key: 'cable_model',
            label: '线缆型号截面',
            group: '线缆信息',
            type: 'cascading-select',
            dependsOn: 'cable_type',
            allowCustom: true,
            isCopyable: true,
            optionsMap: {
                '电缆': [
                    { label: '3*VLV22-25  铝', value: '3*VLV22-25  铝' },
                    { label: '3*VLV22-35  铝', value: '3*VLV22-35  铝' },
                    { label: '3*VLV22-50  铝', value: '3*VLV22-50  铝' },
                    { label: '3*VLV22-70  铝', value: '3*VLV22-70  铝' },
                    { label: '3*VLV22-95  铝', value: '3*VLV22-95  铝' },
                    { label: '3*VLV22-120  铝', value: '3*VLV22-120  铝' },
                    { label: '3*VLV22-150  铝', value: '3*VLV22-150  铝' },
                    { label: '3*VLV22-185  铝', value: '3*VLV22-185  铝' },
                    { label: '3*VLV22-240  铝', value: '3*VLV22-240  铝' },
                    { label: '3*VLV22-300  铝', value: '3*VLV22-300  铝' },
                    { label: '3*VLV22-400  铝', value: '3*VLV22-400  铝' },
                    { label: '3*VLV22-500  铝', value: '3*VLV22-500  铝' },
                    { label: '3*YJLV22-25  铝', value: '3*YJLV22-25  铝' },
                    { label: '3*YJLV22-35  铝', value: '3*YJLV22-35  铝' },
                    { label: '3*YJLV22-50  铝', value: '3*YJLV22-50  铝' },
                    { label: '3*YJLV22-70  铝', value: '3*YJLV22-70  铝' },
                    { label: '3*YJLV22-95  铝', value: '3*YJLV22-95  铝' },
                    { label: '3*YJLV22-120  铝', value: '3*YJLV22-120  铝' },
                    { label: '3*YJLV22-150  铝', value: '3*YJLV22-150  铝' },
                    { label: '3*YJLV22-185  铝', value: '3*YJLV22-185  铝' },
                    { label: '3*YJLV22-240  铝', value: '3*YJLV22-240  铝' },
                    { label: '3*YJLV22-300  铝', value: '3*YJLV22-300  铝' },
                    { label: '3*YJLV22-400  铝', value: '3*YJLV22-400  铝' },
                    { label: '3*YJLV22-500  铝', value: '3*YJLV22-500  铝' },
                    { label: '3*YJLV-25  铝', value: '3*YJLV-25  铝' },
                    { label: '3*YJLV-35  铝', value: '3*YJLV-35  铝' },
                    { label: '3*YJLV-50  铝', value: '3*YJLV-50  铝' },
                    { label: '3*YJLV-70  铝', value: '3*YJLV-70  铝' },
                    { label: '3*YJLV-95  铝', value: '3*YJLV-95  铝' },
                    { label: '3*YJLV-120  铝', value: '3*YJLV-120  铝' },
                    { label: '3*YJLV-150  铝', value: '3*YJLV-150  铝' },
                    { label: '3*YJLV-185  铝', value: '3*YJLV-185  铝' },
                    { label: '3*YJLV-240  铝', value: '3*YJLV-240  铝' },
                    { label: '3*YJLV-300  铝', value: '3*YJLV-300  铝' },
                    { label: '3*YJLV-400  铝', value: '3*YJLV-400  铝' },
                    { label: '3*YJLV-500  铝', value: '3*YJLV-500  铝' },
                    { label: 'YJV22-25  铜', value: 'YJV22-25  铜' },
                    { label: 'YJV22-35  铜', value: 'YJV22-35  铜' },
                    { label: 'YJV22-50  铜', value: 'YJV22-50  铜' },
                    { label: 'YJV22-70  铜', value: 'YJV22-70  铜' },
                    { label: 'YJV22-95  铜', value: 'YJV22-95  铜' },
                    { label: 'YJV22-120  铜', value: 'YJV22-120  铜' },
                    { label: 'YJV22-150  铜', value: 'YJV22-150  铜' },
                    { label: 'YJV22-185  铜', value: 'YJV22-185  铜' },
                    { label: 'YJV22-240  铜', value: 'YJV22-240  铜' },
                    { label: 'YJV22-300  铜', value: 'YJV22-300  铜' },
                    { label: 'YJV22-400  铜', value: 'YJV22-400  铜' },
                    { label: 'YJV22-500  铜', value: 'YJV22-500  铜' },
                    { label: 'ZC-YJV22-25  铜', value: 'ZC-YJV22-25  铜' },
                    { label: 'ZC-YJV22-35  铜', value: 'ZC-YJV22-35  铜' },
                    { label: 'ZC-YJV22-50  铜', value: 'ZC-YJV22-50  铜' },
                    { label: 'ZC-YJV22-70  铜', value: 'ZC-YJV22-70  铜' },
                    { label: 'ZC-YJV22-95  铜', value: 'ZC-YJV22-95  铜' },
                    { label: 'ZC-YJV22-120  铜', value: 'ZC-YJV22-120  铜' },
                    { label: 'ZC-YJV22-150  铜', value: 'ZC-YJV22-150  铜' },
                    { label: 'ZC-YJV22-185  铜', value: 'ZC-YJV22-185  铜' },
                    { label: 'ZC-YJV22-240  铜', value: 'ZC-YJV22-240  铜' },
                    { label: 'ZC-YJV22-300  铜', value: 'ZC-YJV22-300  铜' },
                    { label: 'ZC-YJV22-400  铜', value: 'ZC-YJV22-400  铜' },
                    { label: 'ZC-YJV22-500  铜', value: 'ZC-YJV22-500  铜' },
                    { label: '3*VV22-25  铜', value: '3*VV22-25  铜' },
                    { label: '3*VV22-35  铜', value: '3*VV22-35  铜' },
                    { label: '3*VV22-50  铜', value: '3*VV22-50  铜' },
                    { label: '3*VV22-70  铜', value: '3*VV22-70  铜' },
                    { label: '3*VV22-95  铜', value: '3*VV22-95  铜' },
                    { label: '3*VV22-120  铜', value: '3*VV22-120  铜' },
                    { label: '3*VV22-150  铜', value: '3*VV22-150  铜' },
                    { label: '3*VV22-185  铜', value: '3*VV22-185  铜' },
                    { label: '3*VV22-240  铜', value: '3*VV22-240  铜' },
                    { label: '3*VV22-300  铜', value: '3*VV22-300  铜' },
                    { label: '3*VV22-400  铜', value: '3*VV22-400  铜' },
                    { label: '3*VV22-500  铜', value: '3*VV22-500  铜' }
                ]
            },
            exportOrder: 5,
            exportLabel: '线缆型号截面'
        },

        // ===== 其他 =====
        {
            key: 'remark_1',
            label: '备注1',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 6,
            exportLabel: '备注1'
        },
        {
            key: 'remark_2',
            label: '备注2',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 7,
            exportLabel: '备注2'
        },
        {
            key: 'span_length',
            label: '距离 (m)',
            group: '其他',
            type: 'auto-calc',
            calcType: 'distance_from_prev',
            decimal: 2,
            editable: false,
            exportOrder: 8,
            exportLabel: '距离 (m)'
        },
        {
            key: 'longitude',
            label: '经度',
            group: '其他',
            type: 'auto-calc',
            calcType: '',
            decimal: 8,
            editable: false,
            exportOrder: 9,
            exportLabel: '经度'
        },
        {
            key: 'latitude',
            label: '纬度',
            group: '其他',
            type: 'auto-calc',
            calcType: '',
            decimal: 8,
            editable: false,
            exportOrder: 10,
            exportLabel: '纬度'
        }
    ],

    photoSlots: [
        { key: 'overview', label: '全貌' }
    ],
    extraPhotoSlot: true
}