// schema/station.js — 站房完整字段定义
export default {
    deviceType: 'station',
    label: '站房',
    icon: '/static/icons/station.png',
    category: '10kV',
    nameField: 'station_name',
    children: [{ deviceType: 'station_switchgear', label: '开关柜' }],  // 开关柜作为独立子设备类型，可被其他设备选为上级节点
    isAvailablePreNode: true,   // 站房本身也可被选为上级节点
    isPreNodeEditable: true,
    preNodeFieldName: '上级节点',

    fields: [
        // ===== 基础信息 =====
        {
            key: 'station_name',
            label: '站房名称',
            group: '基础信息',
            type: 'composite-name',
            required: true,
            placeholder: '请输入站房名称',
            exportOrder: 1,
            exportLabel: '站房名称'
        },
        {
            key: 'station_type',
            label: '站房类型',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '开闭所', value: '开闭所' },
                { label: '配电室房', value: '配电室房' },
                { label: '环网柜', value: '环网柜' },
                { label: '电缆分支箱', value: '电缆分支箱' }
            ],
            exportOrder: 2,
            exportLabel: '站房类型'
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
            exportOrder: 3,
            exportLabel: '安装环境'
        },
        {
            key: 'cabinet_layout_method',
            label: '开关柜布置方式',
            group: '基础信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '单列', value: '单列' },
                { label: '双列面对面', value: '双列面对面' },
                { label: '双列背对背', value: '双列背对背' },
                { label: 'L型', value: 'L型' }
            ],
            exportOrder: 4,
            exportLabel: '开关柜布置方式'
        },

        // ===== 母线开关柜信息 =====
        {
            key: 'busbar_count',
            label: '母线数',
            group: '母线开关柜信息',
            type: 'select',
            options: [
                { label: '无母线', value: '0' },
                { label: 'Ⅰ段', value: '1' },
                { label: 'Ⅱ段', value: '2' },
                { label: 'Ⅲ段', value: '3' },
                { label: 'Ⅳ段', value: '4' }
            ],
            // 该字段变化时触发：
            // 1. 动态显示/隐藏电源线路名称字段
            // 2. 动态调整开关柜布局区域数
            exportOrder: 5,
            exportLabel: '母线数'
        },
        {
            key: 'power_line_name_1',
            label: 'Ⅰ段电源线路名称',
            group: '母线开关柜信息',
            type: 'text',
            placeholder: '请输入Ⅰ段电源线路名称',
            visibleWhen: {
                key: 'busbar_count',
                operator: '>=',
                value: '1'
            },
            exportOrder: 6,
            exportLabel: 'Ⅰ段电源线路名称'
        },
        {
            key: 'power_line_name_2',
            label: 'Ⅱ段电源线路名称',
            group: '母线开关柜信息',
            type: 'text',
            placeholder: '请输入Ⅱ段电源线路名称',
            visibleWhen: {
                key: 'busbar_count',
                operator: '>=',
                value: '2'
            },
            exportOrder: 7,
            exportLabel: 'Ⅱ段电源线路名称'
        },
        {
            key: 'power_line_name_3',
            label: 'Ⅲ段电源线路名称',
            group: '母线开关柜信息',
            type: 'text',
            placeholder: '请输入Ⅲ段电源线路名称',
            visibleWhen: {
                key: 'busbar_count',
                operator: '>=',
                value: '3'
            },
            exportOrder: 8,
            exportLabel: 'Ⅲ段电源线路名称'
        },
        {
            key: 'power_line_name_4',
            label: 'Ⅳ段电源线路名称',
            group: '母线开关柜信息',
            type: 'text',
            placeholder: '请输入Ⅳ段电源线路名称',
            visibleWhen: {
                key: 'busbar_count',
                operator: '>=',
                value: '4'
            },
            exportOrder: 9,
            exportLabel: 'Ⅳ段电源线路名称'
        },
        {
            key: 'switchgear_layout',
            label: '开关柜布局',
            group: '母线开关柜信息',
            type: 'switchgear_layout',
            /**
             * ============ 动态布局说明 ============
             *
             * 此字段为站房最核心的交互逻辑，需特殊处理。
             *
             * 【业务规则】
             * 此字段为动态布局字段，根据 busbar_count 动态生成列数。
             * 1. 列数及表头由 busbar_count 决定：
             *    - "无母线"(0) → 不显示这个表单项
             *    - "Ⅰ段"(1) → 1 个列（表头：Ⅰ段母线）
             *    - "Ⅱ段"(2) → 2 个列（表头：Ⅰ段母线、Ⅱ段母线）
             *    - "Ⅲ段"(3) → 3 个列（表头：Ⅰ段母线、Ⅱ段母线、Ⅲ段母线）
             *    - "Ⅳ段"(4) → 4 个列（表头：Ⅰ段母线、Ⅱ段母线、Ⅲ段母线、Ⅳ段母线）
             *
             * 2. 动态生成逻辑（核心交互）：
             *    - 每个列第一行提供一个数字输入框（胶囊样式），用户输入该段母线下的开关柜数量 N。
             *    - 系统自动在该列下方纵向生成 N 个开关柜占位区块。
             *    - 各列生成的区块数量相互独立，且每个区块内部需按从上到下的顺序自动显示序号（1, 2, 3... N）。
             *    - 视觉上呈现为顶部对齐的多列网格布局，下方空白区域不进行补齐。
             *    - 点击一个开关柜占位区块，下方会显示该开关柜的详细信息，可编辑。
             *    
             *
             * 3. 开关柜 (switchgear) 是独立的设备类型（见 schema/switchgear.js），
             *    其他设备（如变压器）可在"上级节点"中选择 某站房 → 某开关柜。
             *
             * 4. 导出时站房和开关柜分开导出为两张工作表。
             * 
             * 【存储结构】
             * 二维数组，一个母线一个数组，每个数组里有N个开关柜id
             *
             */
            dependsOn: 'busbar_count',
            childDeviceType: 'switchgear',  // 生成的子设备类型
            exportOrder: 10,
            exportLabel: '开关柜布局'
        },

        // ===== 其他 =====
        {
            key: 'remark_1',
            label: '备注1',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 11,
            exportLabel: '备注1'
        },
        {
            key: 'remark_2',
            label: '备注2',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 12,
            exportLabel: '备注2'
        },
        {
            key: 'longitude',
            label: '经度',
            group: '其他',
            type: 'auto-calc',
            decimal: 8,
            editable: false,
            exportOrder: 13,
            exportLabel: '经度'
        },
        {
            key: 'latitude',
            label: '纬度',
            group: '其他',
            type: 'auto-calc',
            decimal: 8,
            editable: false,
            exportOrder: 14,
            exportLabel: '纬度'
        }
    ],

    photoSlots: [
        { key: 'front', label: '正面', required: false },
        { key: 'nameplate', label: '名称标识牌', required: false },
        { key: 'wiring_diagram', label: '站内一次接线图', required: false },
        { key: 'busbar_1_small_side', label: 'Ⅰ母小号侧', required: false },
        { key: 'busbar_1_large_side', label: 'Ⅰ母大号侧', required: false },
        { key: 'busbar_2_small_side', label: 'Ⅱ母小号侧', required: false },
        { key: 'busbar_2_large_side', label: 'Ⅱ母大号侧', required: false }
    ],
    extraPhotoSlot: true
}