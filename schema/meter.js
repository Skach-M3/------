// schema/meter.js — 计量信息完整字段定义
export default {
    deviceType: 'meter',
    label: '计量信息',
    icon: '/static/icons/meter.png',
    category: '10kV',
    nameField: 'meter_asset_no',
    children: [],
    isAvailablePreNode: true,
    isPreNodeEditable: true,
    preNodeFieldName: '上级节点',

    fields: [
        // ===== 电表检查信息 =====
        {
            key: 'meter_asset_no',
            label: '电表资产号',
            group: '电表检查信息',
            type: 'text-scan',
            required: true,
            isCopyable: true,
            placeholder: '输入或扫码获取电表资产号',
            scanType: 'barCode',
            exportOrder: 1,
            exportLabel: '电表资产号'
        },
        {
            key: 'metering_method',
            label: '计量方式',
            group: '电表检查信息',
            type: 'select',
            required: true,
            isCopyable: true,
            options: [
                { label: '高供高计', value: '高供高计' },
                { label: '高供低计', value: '高供低计' }
            ],
            exportOrder: 2,
            exportLabel: '计量方式'
        },
        {
            key: 'cabinet_seal',
            label: '箱柜加封锁',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '拆除重封锁', value: '拆除重封锁' },
                { label: '拆除未封锁', value: '拆除未封锁' },
                { label: '无盖', value: '无盖' },
                { label: '无封锁', value: '无封锁' }
            ],
            exportOrder: 3,
            exportLabel: '箱柜加封锁'
        },
        {
            key: 'meter_seal',
            label: '电表加封锁',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '拆除重封锁', value: '拆除重封锁' },
                { label: '拆除未封锁', value: '拆除未封锁' },
                { label: '无盖', value: '无盖' },
                { label: '无封锁', value: '无封锁' }
            ],
            exportOrder: 4,
            exportLabel: '电表加封锁'
        },

        {
            key: 'meter_install_location',
            label: '电表安装位置',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '户外高计分界点', value: '户外高计分界点' },
                { label: '站房出线间隔内', value: '站房出线间隔内' },
                { label: '高压计量箱柜', value: '高压计量箱柜' },
                { label: '低压计量箱柜', value: '低压计量箱柜' }
            ],
            exportOrder: 5,
            exportLabel: '电表安装位置'
        },
        {
            key: 'meter_wiring_check',
            label: '电表接线检查',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '正常', value: '正常' },
                { label: '螺丝松动', value: '螺丝松动' }
            ],
            exportOrder: 6,
            exportLabel: '电表接线检查'
        },
        {
            key: 'meter_junction_box_check',
            label: '电表接线盒检查',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '正常', value: '正常' },
                { label: '螺丝松动', value: '螺丝松动' },
                { label: '无接线盒直接入表', value: '无接线盒直接入表' },
                { label: '有接线盒未经接线盒', value: '有接线盒未经接线盒' }
            ],
            exportOrder: 7,
            exportLabel: '电表接线盒检查'
        },
        {
            key: 'meter_voltage_check',
            label: '电表电压检查',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '正常', value: '正常' }
            ],
            exportOrder: 8,
            exportLabel: '电表电压检查'
        },
        {
            key: 'meter_current_check',
            label: '电表电流检查',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '正常', value: '正常' }
            ],
            exportOrder: 9,
            exportLabel: '电表电流检查'
        },
        {
            key: 'meter_reverse_phase',
            label: '电表逆相序',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '是', value: '是' },
                { label: '否', value: '否' }
            ],
            exportOrder: 10,
            exportLabel: '电表逆相序'
        },
        {
            key: 'meter_quadrant',
            label: '电表四象限',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '一象限右上', value: '一象限右上' },
                { label: '二象限右下', value: '二象限右下' },
                { label: '三象限左下', value: '三象限左下' },
                { label: '四象限左上', value: '四象限左上' }
            ],
            exportOrder: 11,
            exportLabel: '电表四象限'
        },
        {
            key: 'meter_inspection_status',
            label: '电表检查情况',
            group: '电表检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '全部检查', value: '全部检查' },
                { label: '部分检查', value: '部分检查' }
            ],
            exportOrder: 12,
            exportLabel: '电表检查情况'
        },

        // ===== 互感器检查信息 =====
        {
            key: 'ct_install_location',
            label: '互感器安装位置',
            group: '互感器检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '高计架空', value: '高计架空' },
                { label: '高压柜内', value: '高压柜内' },
                { label: '低压柜内', value: '低压柜内' },
                { label: 'JP计量柜内', value: 'JP计量柜内' },
                { label: '变压器上桩头', value: '变压器上桩头' }
            ],
            exportOrder: 13,
            exportLabel: '互感器安装位置'
        },
        {
            key: 'ct_ratio',
            label: '互感器倍率',
            group: '互感器检查信息',
            type: 'text',
            isCopyable: true,
            placeholder: '请输入互感器倍率',
            exportOrder: 14,
            exportLabel: '互感器倍率'
        },
        {
            key: 'ct_wiring_check',
            label: '互感器接线',
            group: '互感器检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '正常', value: '正常' }
            ],
            exportOrder: 15,
            exportLabel: '互感器接线'
        },
        {
            key: 'ct_appearance',
            label: '互感器外观',
            group: '互感器检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '正常', value: '正常' }
            ],
            exportOrder: 16,
            exportLabel: '互感器外观'
        },
        {
            key: 'ct_inspection_status',
            label: '互感器检查情况',
            group: '互感器检查信息',
            type: 'select',
            isCopyable: true,
            options: [
                { label: '其他', value: '其他' },
                { label: '全部检查', value: '全部检查' },
                { label: '部分检查', value: '部分检查' }
            ],
            exportOrder: 17,
            exportLabel: '互感器检查情况'
        },

        // ===== 其他 =====
        {
            key: 'remark_1',
            label: '备注1',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 18,
            exportLabel: '备注1'
        },
        {
            key: 'remark_2',
            label: '备注2',
            group: '其他',
            type: 'textarea',
            maxLength: 500,
            placeholder: '请输入备注',
            exportOrder: 19,
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
            exportOrder: 20,
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
            exportOrder: 21,
            exportLabel: '纬度'
        }
    ],

    photoSlots: [
        { key: 'metering_point_overview', label: '计量点全貌', required: true },
        { key: 'meter_overview', label: '电表全貌', required: true },
        { key: 'meter_front', label: '电表正面', required: false },
        { key: 'junction_box_front', label: '接线盒正面', required: false },
        { key: 'ct_overview', label: '互感器全貌', required: false },
        { key: 'ct_nameplate', label: '互感器铭牌', required: false }
    ],
    extraPhotoSlot: true
}