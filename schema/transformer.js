// schema/transformer.js — 变压器完整字段定义
import transformer_model_options from './transformer_model_options.js'
export default {
    deviceType: 'transformer',
    label: '变压器',
    icon: '/static/icons/transformer.png',
    category: '10kV',
    nameField: 'device_name',
    children: [],
    isAvailablePreNode: false,
    isPreNodeEditable: true,
    preNodeFieldName: '上级节点',

    fields: [
        // ===== 基础信息 =====
        {
            key: 'device_name',
            label: '设备名称',
            group: '基础信息',
            type: 'composite-name',
            required: true,
            isCopyable: true,
            placeholder: '输入设备名称',
            exportOrder: 1,
            exportLabel: '设备名称'
        },
        {
            key: 'usage_nature',
            label: '使用性质',
            group: '基础信息',
            type: 'select',
            required: true,
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '无法识别', value: '无法识别' },
                { label: '公用变', value: '公用变' },
                { label: '专用变', value: '专用变' }
            ],
            exportOrder: 2,
            exportLabel: '使用性质'
        },
        {
            key: 'electricity_nature',
            label: '用电性质',
            group: '基础信息',
            type: 'select',
            required: true,
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '无法识别', value: '无法识别' },
                { label: '农村公变', value: '农村公变' },
                { label: '小区公变', value: '小区公变' },
                { label: '街道公变', value: '街道公变' },
                { label: '物业专变', value: '物业专变' },
                { label: '商城专变', value: '商城专变' },
                { label: '政府专变', value: '政府专变' },
                { label: '路灯专变', value: '路灯专变' },
                { label: '工厂专变', value: '工厂专变' },
                { label: '通信专变', value: '通信专变' }
            ],
            exportOrder: 3,
            exportLabel: '用电性质'
        },
        {
            key: 'equipment_type',
            label: '设备类型',
            group: '基础信息',
            type: 'select',
            required: true,
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '油浸式', value: '油浸式' },
                { label: '干式变', value: '干式变' },
                { label: '箱式变', value: '箱式变' }
            ],
            exportOrder: 4,
            exportLabel: '设备类型'
        },
        {
            key: 'erection_method',
            label: '架设方式',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '架空', value: '架空' },
                { label: '落地', value: '落地' }
            ],
            exportOrder: 5,
            exportLabel: '架设方式'
        },
        {
            key: 'installation_environment',
            label: '安装环境',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '室内', value: '室内' },
                { label: '室外', value: '室外' },
                { label: '地下室', value: '地下室' }
            ],
            exportOrder: 6,
            exportLabel: '安装环境'
        },
        {
            key: 'device_status',
            label: '设备状态',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '运行', value: '运行' },
                { label: '停运', value: '停运' },
                { label: '现场留置', value: '现场留置' },
                { label: '新装未送电', value: '新装未送电' }
            ],
            exportOrder: 7,
            exportLabel: '设备状态'
        },
        {
            key: 'model_source',
            label: '型号容量来源',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '变压器铭牌', value: '变压器铭牌' },
                { label: '名称标识牌', value: '名称标识牌' },
                { label: '所属站房箱变铭牌', value: '所属站房箱变铭牌' }
            ],
            exportOrder: 8,
            exportLabel: '型号容量来源'
        },
        {
            key: 'transformer_model',
            label: '型号',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            allowCustom: true,
            options: transformer_model_options,
            exportOrder: 9,
            exportLabel: '型号'
        },
        {
            key: 'capacity',
            label: '容量（kVA）',
            group: '基础信息',
            type: 'text',
            isCopyable: true,
            placeholder: '请输入容量',
            exportOrder: 10,
            exportLabel: '容量（kVA）'
        },
        {
            key: 'inspection_status',
            label: '变压器检查情况',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '全部检查', value: '全部检查' },
                { label: '部分检查', value: '部分检查' }
            ],
            exportOrder: 11,
            exportLabel: '变压器检查情况'
        },

        // ===== 无功补偿信息 =====
        {
            key: 'reactive_compensation_installation',
            label: '无功补偿安装情况',
            group: '无功补偿信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '已安装', value: '已安装' },
                { label: '未安装', value: '未安装' },
                { label: '未找到', value: '未找到' },
                { label: '打不开', value: '打不开' }
            ],
            exportOrder: 12,
            exportLabel: '无功补偿安装情况'
        },
        {
            key: 'reactive_compensation_input',
            label: '无功补偿投入情况',
            group: '无功补偿信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '已投入', value: '已投入' },
                { label: '未投入', value: '未投入' },
                { label: '部分投入', value: '部分投入' }
            ],
            exportOrder: 13,
            exportLabel: '无功补偿投入情况'
        },
        {
            key: 'has_backup_transformer',
            label: '是否存在主备变',
            group: '无功补偿信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '是', value: '是' },
                { label: '否', value: '否' }
            ],
            exportOrder: 14,
            exportLabel: '是否存在主备变'
        },

        // ===== 主备变信息 =====
        {
            key: 'backup_trans_operation_mode',
            label: '主备变状态（运行方式）',
            group: '主备变信息',
            type: 'select',
            isCopyable: true,
            visibleWhen: { has_backup_transformer: '是' },
            options: [
                { label: '其他', value: '其他' },
                { label: '分段运行', value: '分段运行' },
                { label: '联络运行', value: '联络运行' },
                { label: '低压分段运行', value: '低压分段运行' },
                { label: '低压联络运行', value: '低压联络运行' }
            ],
            exportOrder: 15,
            exportLabel: '主备变状态（运行方式）'
        },
        {
            key: 'backup_trans_run_status',
            label: '主备变状态（运行状态）',
            group: '主备变信息',
            type: 'select',
            isCopyable: true,
            visibleWhen: { has_backup_transformer: '是' },
            options: [
                { label: '其他', value: '其他' },
                { label: '运行', value: '运行' },
                { label: '停运', value: '停运' }
            ],
            exportOrder: 16,
            exportLabel: '主备变状态（运行状态）'
        },
        {
            key: 'backup_trans_name',
            label: '主备变名称',
            group: '主备变信息',
            type: 'text',
            isCopyable: true,
            visibleWhen: { has_backup_transformer: '是' },
            placeholder: '请输入主备变名称',
            exportOrder: 17,
            exportLabel: '主备变名称'
        },
        {
            key: 'backup_trans_model',
            label: '主备变型号',
            group: '主备变信息',
            type: 'select',
            isCopyable: true,
            allowCustom: true,
            visibleWhen: { has_backup_transformer: '是' },
            options: transformer_model_options,
            exportOrder: 18,
            exportLabel: '主备变型号'
        },
        {
            key: 'backup_trans_capacity',
            label: '主备变容量（kVA）',
            group: '主备变信息',
            type: 'text',
            isCopyable: true,
            visibleWhen: { has_backup_transformer: '是' },
            placeholder: '请输入主备变容量',
            exportOrder: 19,
            exportLabel: '主备变容量（kVA）'
        },
        {
            key: 'backup_trans_power_line',
            label: '主备变电源线路',
            group: '主备变信息',
            type: 'text',
            isCopyable: true,
            visibleWhen: { has_backup_transformer: '是' },
            placeholder: '请输入主备变电源线路',
            exportOrder: 20,
            exportLabel: '主备变电源线路'
        },

        // ===== 其他 =====
        {
            key: 'remark_1',
            label: '备注1',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 21,
            exportLabel: '备注1'
        },
        {
            key: 'remark_2',
            label: '备注2',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 22,
            exportLabel: '备注2'
        },
        {
            key: 'longitude',
            label: '经度',
            group: '其他',
            type: 'auto-calc',
            calcType: '',
            decimal: 8,
            editable: false,
            exportOrder: 23,
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
            exportOrder: 24,
            exportLabel: '纬度'
        }
    ],

    photoSlots: [
        { key: 'overview', label: '全貌', required: true },
        { key: 'front', label: '正面', required: false },
        { key: 'nameplate', label: '名称标识牌', required: false },
        { key: 'factory_plate', label: '出厂铭牌', required: false },
        { key: 'capacitor_overview', label: '电容器全貌', required: false },
        { key: 'backup_trans_overview', label: '主备变全貌', required: false },
        { key: 'backup_trans_front', label: '主备变正面', required: false },
        { key: 'backup_trans_nameplate', label: '主备变名称标识牌', required: false },
        { key: 'backup_trans_factory_plate', label: '主备变出厂铭牌', required: false }
    ],
    extraPhotoSlot: true
}