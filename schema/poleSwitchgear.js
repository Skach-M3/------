// schema/poleSwitchgear.js — 柱上开关
export default {
    deviceType: 'pole_switchgear',
    label: '柱上开关',
    icon: '/static/icons/switchgear.png',
    category: '10kV',
    isChild: true,
    parentTypes: ['pole'],
    nameField: 'switch_name',

    fields: [
        {
            key: 'switch_name',
            label: '开关名称',
            group: '基础信息',
            type: 'text',
            required: true,
            inheritName: true,
            placeholder: '默认继承杆塔名称+开关类型',
            exportOrder: 1,
            exportLabel: '开关名称'
        },
        {
            key: 'switch_function',
            label: '开关作用',
            group: '基础信息',
            type: 'checkbox',
            options: [
                { label: '分段', value: '分段' },
                { label: '分支', value: '分支' },
                { label: '联络', value: '联络' },
                { label: '用户', value: '用户' }
            ],
            exportOrder: 2,
            exportLabel: '开关作用'
        },
        {
            key: 'switch_status',
            label: '开关状态',
            group: '基础信息',
            type: 'radio',
            options: [
                { label: '分', value: '分' },
                { label: '合', value: '合' }
            ],
            exportOrder: 3,
            exportLabel: '开关状态'
        },
        {
            key: 'switch_type',
            label: '开关类型',
            group: '基础信息',
            type: 'radio',
            options: [
                { label: '智能', value: '智能' },
                { label: '非智能', value: '非智能' }
            ],
            exportOrder: 4,
            exportLabel: '开关类型'
        },
        {
            key: 'switch_target',
            label: '开关对象',
            group: '基础信息',
            type: 'text',
            placeholder: '请输入开关对象',
            exportOrder: 5,
            exportLabel: '开关对象'
        },
        {
            key: 'remark',
            label: '备注',
            group: '基础信息',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 6,
            exportLabel: '备注'
        }
    ],

    photoSlots: [
        { key: 'name_plate', label: '名称标识牌', required: false, max: 3 },
        { key: 'close_up', label: '近景', required: false, max: 3 }
    ],
    extraPhotoSlot: true
}