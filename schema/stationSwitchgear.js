// schema/station-switchgear.js — 站房开关柜（站房子设备）
export default {
    deviceType: 'station_switchgear',
    label: '站房开关柜',
    icon: '/static/icons/switchgear.png',
    category: '10kV',
    nameField: 'cabinet_name',

    // ===== 父子关系 =====
    parentDeviceType: 'station',          // 父设备为站房
    parentFieldKey: 'belong_station',     // 关联父设备的字段
    isAvailablePreNode: true,             // 可被其他设备选为上级节点

    fields: [
        // ===== 基础信息 =====
        {
            key: 'belong_station',
            label: '所属杆站房',
            group: '基础信息',
            type: 'auto-fill',
            source: 'parent',                // 自动取父设备（站房）名称
            editable: false,
            required: true,
            placeholder: '自动获取当前站房名称',
            exportOrder: 1,
            exportLabel: '所属杆站房'
        },
        {
            key: 'cabinet_name',
            label: '开关柜名称',
            group: '基础信息',
            type: 'text',
            required: true,
            placeholder: '请输入开关柜名称',
            exportOrder: 2,
            exportLabel: '开关柜名称'
        },
        {
            key: 'cabinet_number',
            label: '开关柜编号',
            group: '基础信息',
            type: 'auto-text',
            editable: true,                  // 自动生成但允许手动修改
            autoGenerate: true,
            /**
             * 自动生成规则：站房名称 + 所在区域位置 + 序号
             * 例：花园开闭所Ⅰ段母线开关柜01
             *
             * 依赖：
             * - belong_station（父站房名称）
             * - region_label（来自站房布局的区域标签，如"Ⅰ段母线"）
             * - 区域内自增序号（两位补零）
             */
            generateRule: {
                parts: [
                    { type: 'field', key: 'belong_station' },
                    { type: 'field', key: 'region_label' },
                    { type: 'literal', value: '开关柜' },
                    { type: 'sequence', pad: 2, scope: 'region' }
                ]
            },
            placeholder: '自动生成，如：花园开闭所Ⅰ段母线开关柜01',
            exportOrder: 3,
            exportLabel: '开关柜编号'
        },
        {
            key: 'cabinet_type',
            label: '开关柜类型',
            group: '基础信息',
            type: 'select',
            required: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '电源进线柜', value: '电源进线柜' },
                { label: '电源出线柜', value: '电源出线柜' },
                { label: '变压器出线柜', value: '变压器出线柜' },
                { label: '计量柜', value: '计量柜' },
                { label: '联络柜', value: '联络柜' },
                { label: '无法识别', value: '无法识别' }
            ],
            exportOrder: 4,
            exportLabel: '开关柜类型'
        },
        {
            key: 'switch_status',
            label: '开关状态',
            group: '基础信息',
            type: 'select',
            required: true,
            options: [
                { label: '分', value: '分' },
                { label: '合', value: '合' },
                { label: '无法识别', value: '无法识别' }
            ],
            exportOrder: 5,
            exportLabel: '开关状态'
        },
        {
            key: 'remark_1',
            label: '备注(1)',
            group: '基础信息',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 6,
            exportLabel: '备注1'
        },
        {
            key: 'remark_2',
            label: '备注(2)',
            group: '基础信息',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 7,
            exportLabel: '备注2'
        },
        {
            key: 'region_label',
            label: '所属区域',
            type: 'hidden',
            source: 'parent-layout',         // 由站房 switchgear_layout 自动注入
            // 值如："Ⅰ段母线"、"Ⅱ母小号侧" 等
            exportOrder: 8,
            exportLabel: '所属区域'
        },
        {
            key: 'region_key',
            label: '区域标识',
            type: 'hidden',
            source: 'parent-layout'
        },
        {
            key: 'sort_index',
            label: '区域内排序',
            type: 'hidden',
            source: 'parent-layout'
        }
    ],

    // ===== 隐藏字段（由站房布局自动写入） =====
    hiddenFields: [

    ],

    // ===== 照片 =====
    photoSlots: [
        { key: 'full_view', label: '全貌', required: true }
    ],
    extraPhotoSlot: false
}