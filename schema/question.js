// schema/question.js — 问题完整字段定义
export default {
    deviceType: 'question',
    label: '问题',
    category: '10kV',
    nameField: 'question_type',   // 该字段的值会同步写入 t_device.name
    isAvailablePreNode: false,  // 是否出现在上级节点待选
    isPreNodeEditable: true,  // 是否可编辑上级节点
    preNodeFieldName: "所属节点",

    fields: [
        {
            key: 'question_type',
            label: '问题类型',
            type: 'checkbox',
            required: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '设备隐患', value: '设备隐患' },
                { label: '环境隐患', value: '环境隐患' },
                { label: '计量问题', value: '计量问题' },
                { label: '管理线损', value: '管理线损' },
                { label: '技术线损', value: '技术线损' }
            ],
            exportOrder: 1,
            exportLabel: '问题类型'
        },
        {
            key: 'question_description',
            label: '问题描述',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 2,
            exportLabel: '问题描述'
        },
        {
            key: 'remark_1',
            label: '备注1',
            group: '附属设备与其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 3,
            exportLabel: '备注1'
        },
        {
            key: 'remark_2',
            label: '备注2',
            group: '附属设备与其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 4,
            exportLabel: '备注2'
        },
        {
            key: 'longitude',
            label: '经度',
            group: '附属设备与其他',
            type: 'auto-calc',
            calcType: '',
            decimal: 8,
            editable: false,
            exportOrder: 5,
            exportLabel: '经度'
        },
        {
            key: 'latitude',
            label: '纬度',
            group: '附属设备与其他',
            type: 'auto-calc',
            calcType: '',
            decimal: 8,
            editable: false,
            exportOrder: 6,
            exportLabel: '纬度'
        }
    ],

    photoSlots: [
        { key: 'question_photo_1', label: '问题照片(1)', required: false },
        { key: 'question_photo_2', label: '问题照片(2)', required: false },
        { key: 'question_photo_3', label: '问题照片(3)', required: false },
        { key: 'question_photo_4', label: '问题照片(4)', required: false }
    ],
    extraPhotoSlot: true
}
