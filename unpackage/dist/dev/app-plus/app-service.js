if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const ON_SHOW = "onShow";
  const ON_HIDE = "onHide";
  const ON_LOAD = "onLoad";
  const ON_UNLOAD = "onUnload";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  const createLifeCycleHook = (lifecycle, flag = 0) => (hook, target = vue.getCurrentInstance()) => {
    !vue.isInSSRComponentSetup && vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createLifeCycleHook(
    ON_SHOW,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onHide = /* @__PURE__ */ createLifeCycleHook(
    ON_HIDE,
    1 | 2
    /* HookFlags.PAGE */
  );
  const onLoad = /* @__PURE__ */ createLifeCycleHook(
    ON_LOAD,
    2
    /* HookFlags.PAGE */
  );
  const onUnload = /* @__PURE__ */ createLifeCycleHook(
    ON_UNLOAD,
    2
    /* HookFlags.PAGE */
  );
  const themeColor = "#006567";
  const themeColorLight = "rgba(0, 101, 103, 0.1)";
  const _sfc_main$5 = /* @__PURE__ */ vue.defineComponent({
    __name: "lineList",
    setup(__props, { expose: __expose }) {
      __expose();
      const keyword = vue.ref("");
      const lineList = vue.ref([
        { id: 1, name: "10KV奥体145线[12km]", date: "2026-03-04" },
        { id: 2, name: "10KV奥体145线[12km]", date: "2026-03-04" },
        { id: 3, name: "10KV奥体145线[12km]", date: "2026-03-04" },
        { id: 4, name: "10KV奥体145线[12km]", date: "2026-03-04" }
      ]);
      const handleCollect = (item) => {
        formatAppLog("log", "at pages/index/lineList.vue:87", "进入采集", item);
      };
      const handleEdit = (item) => {
        formatAppLog("log", "at pages/index/lineList.vue:92", "编辑", item);
      };
      const handleCreate = () => {
        formatAppLog("log", "at pages/index/lineList.vue:96", "新建线路");
      };
      const __returned__ = { themeColor, themeColorLight, keyword, lineList, handleCollect, handleEdit, handleCreate };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  const _export_sfc = (sfc, props) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props) {
      target[key] = val;
    }
    return target;
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_navbar = vue.resolveComponent("u-navbar");
    const _component_u_icon = vue.resolveComponent("u-icon");
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createVNode(_component_u_navbar, {
        title: "线路",
        bgColor: $setup.themeColor,
        titleStyle: "color: #ffffff; font-weight: bold; font-size: 34rpx;",
        leftIconColor: "#ffffff",
        autoBack: true,
        placeholder: ""
      }),
      vue.createElementVNode("view", { class: "search-wrapper" }, [
        vue.createElementVNode("view", { class: "search-box" }, [
          vue.createVNode(_component_u_icon, {
            name: "search",
            size: "44rpx",
            color: "#999999"
          }),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              class: "search-input",
              type: "text",
              "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.keyword = $event),
              placeholder: "按名字搜索线路",
              "placeholder-class": "search-placeholder"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.keyword]
          ])
        ])
      ]),
      vue.createElementVNode("scroll-view", {
        "scroll-y": "",
        class: "list-container"
      }, [
        vue.createElementVNode("view", { class: "list-content" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.lineList, (item, index) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                class: "card-item",
                key: index
              }, [
                vue.createElementVNode("view", { class: "card-header" }, [
                  vue.createElementVNode("view", { class: "header-left" }, [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "tag",
                        style: vue.normalizeStyle({ color: $setup.themeColor, backgroundColor: $setup.themeColorLight })
                      },
                      "线路",
                      4
                      /* STYLE */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "title" },
                      vue.toDisplayString(item.name),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode(
                    "text",
                    { class: "date" },
                    vue.toDisplayString(item.date),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "card-actions" }, [
                  vue.createElementVNode("view", {
                    class: "action-btn btn-collect",
                    onClick: ($event) => $setup.handleCollect(item)
                  }, "进入采集", 8, ["onClick"]),
                  vue.createElementVNode("view", {
                    class: "action-btn btn-edit",
                    onClick: ($event) => $setup.handleEdit(item)
                  }, "编辑", 8, ["onClick"])
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "bottom-spacer" })
      ]),
      vue.createElementVNode("view", { class: "bottom-bar" }, [
        vue.createElementVNode(
          "view",
          {
            class: "submit-btn",
            style: vue.normalizeStyle({ backgroundColor: $setup.themeColor }),
            onClick: $setup.handleCreate
          },
          " 新建线路 ",
          4
          /* STYLE */
        )
      ])
    ]);
  }
  const PagesIndexLineList = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-d41356c8"], ["__file", "D:/code/电力设备采集/pages/index/lineList.vue"]]);
  let dbName = "collector";
  let dbPath = "_doc/collector.db";
  function escapeValue(val) {
    if (val === null || val === void 0)
      return "NULL";
    if (typeof val === "number")
      return String(val);
    return "'" + String(val).replace(/'/g, "''") + "'";
  }
  function buildSql(sql, params = []) {
    let i = 0;
    return sql.replace(/\?/g, () => {
      return escapeValue(params[i++]);
    });
  }
  const dbHelper = {
    open() {
      plus.sqlite.openDatabase({
        name: dbName,
        path: dbPath
      });
    },
    execute(sql, params = []) {
      const finalSql = buildSql(sql, params);
      formatAppLog("log", "at db/dbHelper.js:31", "== 执行SQL ==", finalSql);
      return new Promise((resolve, reject) => {
        plus.sqlite.executeSql({
          name: dbName,
          sql: finalSql,
          success(res) {
            resolve(res);
          },
          fail(err) {
            formatAppLog("error", "at db/dbHelper.js:40", "SQL执行失败:", finalSql, err);
            reject(err);
          }
        });
      });
    },
    select(sql, params = []) {
      const finalSql = buildSql(sql, params);
      formatAppLog("log", "at db/dbHelper.js:49", "== 查询SQL ==", finalSql);
      return new Promise((resolve, reject) => {
        plus.sqlite.selectSql({
          name: dbName,
          sql: finalSql,
          success(res) {
            resolve(res);
          },
          fail(err) {
            formatAppLog("error", "at db/dbHelper.js:58", "SQL查询失败:", finalSql, err);
            reject(err);
          }
        });
      });
    },
    selectOne(sql, params = []) {
      return this.select(sql, params).then((rows) => rows[0] || null);
    }
  };
  async function initDatabase() {
    plus.sqlite.openDatabase({
      name: "collector",
      path: "_doc/collector.db"
    });
    await dbHelper.execute(`
    CREATE TABLE IF NOT EXISTS t_task (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      type        TEXT NOT NULL,
      line_name   TEXT,
      area_name   TEXT,
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL,
      status      TEXT DEFAULT 'active'
    )
  `);
    await dbHelper.execute(`
    CREATE TABLE IF NOT EXISTS t_device (
      id          TEXT PRIMARY KEY,
      task_id     TEXT NOT NULL,
      device_type TEXT NOT NULL,
      name        TEXT,
      longitude   REAL,
      latitude    REAL,
      parent_id   TEXT,
      attributes  TEXT DEFAULT '{}',
      photos      TEXT DEFAULT '[]',
      status      TEXT DEFAULT 'draft',
      created_at  INTEGER NOT NULL,
      updated_at  INTEGER NOT NULL
    )
  `);
    formatAppLog("log", "at db/init.js:41", "=== 数据库初始化完成 ===");
  }
  const pole = {
    deviceType: "pole",
    label: "杆塔",
    icon: "/static/icons/pole.png",
    category: "10kV",
    // 所属分类，用于"+"菜单分组
    fields: [
      {
        key: "pole_number",
        label: "杆塔编号",
        type: "text",
        required: true,
        placeholder: "请输入杆塔编号",
        exportOrder: 1,
        exportLabel: "杆塔编号"
      },
      {
        key: "pole_type",
        label: "杆型",
        type: "radio",
        required: true,
        options: [
          { label: "直线杆", value: "straight" },
          { label: "耐张杆", value: "tension" },
          { label: "转角杆", value: "corner" }
        ],
        exportOrder: 2,
        exportLabel: "杆型"
      },
      {
        key: "material",
        label: "杆材",
        type: "radio",
        options: [
          { label: "水泥杆", value: "concrete" },
          { label: "铁塔", value: "steel" },
          { label: "木杆", value: "wood" }
        ],
        exportOrder: 3,
        exportLabel: "杆材"
      },
      {
        key: "height",
        label: "杆高(m)",
        type: "number",
        placeholder: "请输入",
        exportOrder: 4,
        exportLabel: "杆高(m)"
      },
      {
        key: "remark",
        label: "备注",
        type: "textarea",
        maxLength: 200,
        exportOrder: 99,
        exportLabel: "备注"
      }
    ],
    photoSlots: [
      { key: "overview", label: "全景照", required: true, max: 2 },
      { key: "nameplate", label: "铭牌照", required: false, max: 1 }
    ]
  };
  const schemaMap = {};
  const schemaList = [];
  function register(schema) {
    schemaMap[schema.deviceType] = schema;
    schemaList.push(schema);
  }
  register(pole);
  function getSchema(deviceType) {
    return schemaMap[deviceType] || null;
  }
  function getAllSchemas() {
    return schemaList;
  }
  const _sfc_main$4 = {
    data() {
      return {
        logText: "点击按钮开始测试...\n",
        deviceList: []
      };
    },
    methods: {
      log(msg) {
        formatAppLog("log", "at pages/test/test.vue:58", msg);
        this.logText += msg + "\n";
      },
      // ========== 测试1：数据库初始化 ==========
      async testInitDB() {
        try {
          await initDatabase();
          this.log("✅ 数据库初始化成功");
        } catch (e) {
          this.log("❌ 数据库初始化失败: " + JSON.stringify(e));
        }
      },
      // ========== 测试2：插入数据 ==========
      async testInsert() {
        try {
          const now = Date.now();
          const id = "test_" + now;
          const attributes = {
            pole_number: "GT-001",
            pole_type: "straight",
            material: "concrete",
            height: "12"
          };
          await dbHelper.execute(
            `INSERT INTO t_device 
            (id, task_id, device_type, name, longitude, latitude, parent_id, attributes, photos, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              id,
              "task_001",
              "pole",
              "测试杆塔",
              116.397428,
              39.90923,
              "",
              JSON.stringify(attributes),
              "[]",
              "saved",
              now,
              now
            ]
          );
          this.log("✅ 插入成功, id=" + id);
        } catch (e) {
          this.log("❌ 插入失败: " + JSON.stringify(e));
        }
      },
      // ========== 测试3：查询数据 ==========
      async testSelect() {
        try {
          const rows = await dbHelper.select(
            "SELECT * FROM t_device WHERE task_id=?",
            ["task_001"]
          );
          this.log("✅ 查询到 " + rows.length + " 条数据");
          this.deviceList = rows;
          rows.forEach((row, i) => {
            const attr = JSON.parse(row.attributes || "{}");
            this.log(
              `  [${i}] ${row.name} | 类型=${row.device_type} | 编号=${attr.pole_number} | 经度=${row.longitude}`
            );
          });
        } catch (e) {
          this.log("❌ 查询失败: " + JSON.stringify(e));
        }
      },
      // ========== 测试4：Schema注册 ==========
      testSchema() {
        try {
          const all = getAllSchemas();
          this.log("✅ 已注册 " + all.length + " 种设备类型:");
          all.forEach((s) => {
            this.log(`  - ${s.label}(${s.deviceType}), ${s.fields.length}个字段`);
          });
          const pole2 = getSchema("pole");
          if (pole2) {
            this.log("✅ 获取pole Schema成功:");
            pole2.fields.forEach((f) => {
              this.log(`    ${f.key}: ${f.type} ${f.required ? "(必填)" : ""}`);
            });
          } else {
            this.log("❌ 未找到 pole Schema");
          }
        } catch (e) {
          this.log("❌ Schema验证失败: " + JSON.stringify(e));
        }
      },
      // ========== 测试5：打开杆塔页面 ==========
      goFormTest() {
        uni.navigateTo({
          url: "/pages/device/edit?taskId=task_001&deviceType=pole"
        });
      },
      goEdit(item) {
        uni.navigateTo({
          url: `/pages/device/edit?taskId=${item.task_id}&deviceType=${item.device_type}&deviceId=${item.id}`
        });
      }
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", {
      class: "container",
      style: { "padding": "30rpx" }
    }, [
      vue.createElementVNode("text", { style: { "font-size": "36rpx", "font-weight": "bold" } }, "数据库验证\\n\\n"),
      vue.createElementVNode("button", {
        onClick: _cache[0] || (_cache[0] = (...args) => $options.testInitDB && $options.testInitDB(...args)),
        type: "primary",
        style: { "margin-bottom": "20rpx" }
      }, " 1. 初始化数据库 "),
      vue.createElementVNode("button", {
        onClick: _cache[1] || (_cache[1] = (...args) => $options.testInsert && $options.testInsert(...args)),
        type: "primary",
        style: { "margin-bottom": "20rpx" }
      }, " 2. 插入一条设备数据 "),
      vue.createElementVNode("button", {
        onClick: _cache[2] || (_cache[2] = (...args) => $options.testSelect && $options.testSelect(...args)),
        type: "primary",
        style: { "margin-bottom": "20rpx" }
      }, " 3. 查询设备列表 "),
      vue.createElementVNode("button", {
        onClick: _cache[3] || (_cache[3] = (...args) => $options.testSchema && $options.testSchema(...args)),
        type: "warn",
        style: { "margin-bottom": "20rpx" }
      }, " 4. 验证 Schema 注册 "),
      vue.createElementVNode("button", {
        onClick: _cache[4] || (_cache[4] = (...args) => $options.goFormTest && $options.goFormTest(...args)),
        type: "primary",
        style: { "margin-bottom": "20rpx" }
      }, " 5. 打开杆塔表单 "),
      vue.createElementVNode("view", { style: { "margin-top": "30rpx", "background": "#f5f5f5", "padding": "20rpx", "border-radius": "10rpx" } }, [
        vue.createElementVNode(
          "text",
          { style: { "font-size": "24rpx", "word-break": "break-all" } },
          vue.toDisplayString($data.logText),
          1
          /* TEXT */
        )
      ]),
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($data.deviceList, (item) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: item.id,
            style: { "padding": "15rpx", "border-bottom": "1px solid #eee" },
            onClick: ($event) => $options.goEdit(item)
          }, [
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString(item.name) + " - " + vue.toDisplayString(item.device_type),
              1
              /* TEXT */
            )
          ], 8, ["onClick"]);
        }),
        128
        /* KEYED_FRAGMENT */
      ))
    ]);
  }
  const PagesTestTest = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__file", "D:/code/电力设备采集/pages/test/test.vue"]]);
  const TIANDITU_KEY = "a30fe8f02deafbdc08192aa8f81c0044";
  const _sfc_main$3 = /* @__PURE__ */ vue.defineComponent({
    __name: "index",
    setup(__props, { expose: __expose }) {
      __expose();
      const isLocating = vue.ref(true);
      const isRetrying = vue.ref(false);
      let retryTimer = null;
      const locationInfo = vue.reactive({
        latitude: "获取中...",
        longitude: "获取中...",
        accuracy: "--",
        address: "正在获取位置..."
      });
      const taskList = vue.ref([
        { id: 1, type: "line", typeText: "线路", title: "10KV奥体145线[12km]", date: "2026-03-04" },
        { id: 2, type: "substation", typeText: "台区", title: "400V城南小区配电设施普查", date: "2026-03-04" }
      ]);
      const clearRetryTimer = () => {
        if (retryTimer) {
          clearInterval(retryTimer);
          retryTimer = null;
        }
      };
      const startLocation = (isSilent = false) => {
        isLocating.value = true;
        if (!isSilent) {
          locationInfo.address = "正在获取位置...";
        } else {
          locationInfo.address = "等待GPS信号，正在自动重试...";
        }
        uni.getLocation({
          type: "gcj02",
          // 国测局坐标系，天地图适用
          isHighAccuracy: true,
          geocode: true,
          success: (res) => {
            clearRetryTimer();
            isRetrying.value = false;
            locationInfo.latitude = res.latitude.toFixed(6);
            locationInfo.longitude = res.longitude.toFixed(6);
            locationInfo.accuracy = res.accuracy ? `${res.accuracy}米` : "未知";
            if (res.address) {
              const addr = res.address;
              locationInfo.address = `${addr.province || ""}${addr.city || ""}${addr.district || ""}${addr.street || ""}${addr.streetNum || ""}${addr.poiName || ""}` || "未知详细地址";
            } else {
              locationInfo.address = "地址解析成功 (具体地址需配置地图SDK)";
            }
            isLocating.value = false;
          },
          fail: (err) => {
            formatAppLog("warn", "at pages/index/index.vue:174", "获取定位失败:", err);
            locationInfo.latitude = "获取失败";
            locationInfo.longitude = "获取失败";
            locationInfo.accuracy = "--";
            locationInfo.address = "定位失败，请开启GPS或检查权限";
            if (!isSilent) {
              uni.showToast({
                title: "定位失败，请开启手机GPS",
                icon: "none",
                duration: 2e3
              });
            }
            isRetrying.value = true;
            if (!retryTimer) {
              retryTimer = setInterval(() => {
                startLocation(true);
              }, 3e3);
            }
          }
        });
      };
      const handleAction = (type) => {
        formatAppLog("log", "at pages/index/index.vue:202", "点击了:", type);
      };
      onLoad(() => {
        startLocation(false);
      });
      onShow(() => {
        if (isRetrying.value) {
          clearRetryTimer();
          startLocation(true);
        }
      });
      onHide(() => {
        clearRetryTimer();
      });
      onUnload(() => {
        clearRetryTimer();
      });
      const __returned__ = { TIANDITU_KEY, isLocating, isRetrying, get retryTimer() {
        return retryTimer;
      }, set retryTimer(v) {
        retryTimer = v;
      }, locationInfo, taskList, clearRetryTimer, startLocation, handleAction };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  });
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_icon = vue.resolveComponent("u-icon");
    return vue.openBlock(), vue.createElementBlock("view", { class: "page-container" }, [
      vue.createElementVNode("view", { class: "nav-bar" }, [
        vue.createElementVNode("view", { class: "logo-box" }, [
          vue.createElementVNode("text", { class: "logo-text" }, "R")
        ]),
        vue.createElementVNode("text", { class: "app-title" }, "现场采集工具")
      ]),
      vue.createElementVNode("view", { class: "header-section" }, [
        vue.createElementVNode("view", { class: "info-panel" }, [
          vue.createElementVNode("view", { class: "status-radar" }, [
            vue.createElementVNode(
              "view",
              {
                class: vue.normalizeClass(["radar-circle", { "connected": !$setup.isLocating }])
              },
              [
                $setup.isLocating ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 0,
                  class: "spinner-border"
                })) : vue.createCommentVNode("v-if", true),
                vue.createElementVNode(
                  "text",
                  { class: "status-text" },
                  vue.toDisplayString($setup.isLocating ? "连接中" : "已连接"),
                  1
                  /* TEXT */
                )
              ],
              2
              /* CLASS */
            )
          ]),
          vue.createElementVNode("view", { class: "location-data" }, [
            vue.createElementVNode(
              "text",
              { class: "data-line" },
              "纬度：" + vue.toDisplayString($setup.locationInfo.latitude),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "data-line" },
              "经度：" + vue.toDisplayString($setup.locationInfo.longitude),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "data-line" },
              "精度：±" + vue.toDisplayString($setup.locationInfo.accuracy),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "data-line address-text" },
              vue.toDisplayString($setup.locationInfo.address),
              1
              /* TEXT */
            )
          ])
        ])
      ]),
      vue.createElementVNode("scroll-view", {
        "scroll-y": "",
        class: "main-content"
      }, [
        vue.createElementVNode("view", { class: "card-box" }, [
          vue.createElementVNode("view", { class: "card-title" }, "现场作业"),
          vue.createElementVNode("view", { class: "action-grid" }, [
            vue.createElementVNode("view", {
              class: "action-item",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.handleAction("line"))
            }, [
              vue.createElementVNode("view", { class: "icon-wrapper theme-bg" }, [
                vue.createVNode(_component_u_icon, {
                  name: "share",
                  color: "#fff",
                  size: "32"
                })
              ]),
              vue.createElementVNode("text", { class: "action-name" }, "线路采集")
            ]),
            vue.createElementVNode("view", {
              class: "action-item",
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.handleAction("substation"))
            }, [
              vue.createElementVNode("view", { class: "icon-wrapper green-bg" }, [
                vue.createVNode(_component_u_icon, {
                  name: "grid",
                  color: "#fff",
                  size: "32"
                })
              ]),
              vue.createElementVNode("text", { class: "action-name" }, "台区采集")
            ])
          ])
        ]),
        vue.createElementVNode("view", { class: "card-box" }, [
          vue.createElementVNode("view", { class: "card-title" }, "采集任务"),
          vue.createElementVNode("view", { class: "task-list" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.taskList, (task) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  class: "task-item",
                  key: task.id
                }, [
                  vue.createElementVNode("view", { class: "task-header" }, [
                    vue.createElementVNode("view", { class: "task-title-group" }, [
                      vue.createElementVNode(
                        "text",
                        {
                          class: vue.normalizeClass(["task-tag", task.type === "line" ? "tag-blue" : "tag-green"])
                        },
                        vue.toDisplayString(task.typeText),
                        3
                        /* TEXT, CLASS */
                      ),
                      vue.createElementVNode(
                        "text",
                        { class: "task-title u-line-1" },
                        vue.toDisplayString(task.title),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "task-date" },
                      vue.toDisplayString(task.date),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode("view", { class: "task-actions" }, [
                    vue.createElementVNode("view", { class: "btn-group" }, [
                      vue.createElementVNode("view", {
                        class: "action-btn btn-orange",
                        onClick: _cache[2] || (_cache[2] = () => {
                        })
                      }, "进入采集"),
                      vue.createElementVNode("view", {
                        class: "action-btn btn-blue",
                        onClick: _cache[3] || (_cache[3] = () => {
                        })
                      }, "导出数据"),
                      vue.createElementVNode("view", {
                        class: "action-btn btn-gray",
                        onClick: _cache[4] || (_cache[4] = () => {
                        })
                      }, "编辑"),
                      vue.createElementVNode("view", {
                        class: "action-btn btn-gray",
                        onClick: _cache[5] || (_cache[5] = () => {
                        })
                      }, "删除")
                    ])
                  ])
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        vue.createElementVNode("view", { class: "bottom-spacer" })
      ])
    ]);
  }
  const PagesIndexIndex = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-1cf27b2a"], ["__file", "D:/code/电力设备采集/pages/index/index.vue"]]);
  const _sfc_main$2 = {
    name: "SchemaForm",
    props: {
      schema: {
        type: Object,
        required: true
      },
      modelValue: {
        type: Object,
        default: () => ({})
      }
    },
    emits: ["update:modelValue"],
    data() {
      return {
        errors: {}
      };
    },
    methods: {
      onInput(key, value) {
        const newVal = { ...this.modelValue, [key]: value };
        this.$emit("update:modelValue", newVal);
        if (this.errors[key]) {
          this.errors = { ...this.errors, [key]: "" };
        }
      },
      getPickerIndex(field) {
        if (!field.options)
          return 0;
        const idx = field.options.findIndex((o) => o.value === this.modelValue[field.key]);
        return idx >= 0 ? idx : 0;
      },
      getPickerLabel(field) {
        if (!field.options || !this.modelValue[field.key])
          return "";
        const opt = field.options.find((o) => o.value === this.modelValue[field.key]);
        return opt ? opt.label : "";
      },
      onPickerChange(field, index) {
        const opt = field.options[index];
        if (opt) {
          this.onInput(field.key, opt.value);
        }
      },
      // 供父组件调用的验证方法
      validate() {
        const errs = {};
        let valid = true;
        this.schema.fields.forEach((field) => {
          if (field.required) {
            const val = this.modelValue[field.key];
            if (val === void 0 || val === null || val === "") {
              errs[field.key] = field.label + "不能为空";
              valid = false;
            }
          }
        });
        this.errors = errs;
        return valid;
      }
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "schema-form" }, [
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($props.schema.fields, (field) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: field.key,
            class: "form-item"
          }, [
            vue.createElementVNode("view", { class: "form-label" }, [
              vue.createElementVNode(
                "text",
                { class: "label-text" },
                vue.toDisplayString(field.label),
                1
                /* TEXT */
              ),
              field.required ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 0,
                class: "required-star"
              }, "*")) : vue.createCommentVNode("v-if", true)
            ]),
            field.type === "text" ? (vue.openBlock(), vue.createElementBlock("input", {
              key: 0,
              class: "form-input",
              value: $props.modelValue[field.key] || "",
              placeholder: field.placeholder || "",
              onInput: ($event) => $options.onInput(field.key, $event.detail.value)
            }, null, 40, ["value", "placeholder", "onInput"])) : vue.createCommentVNode("v-if", true),
            field.type === "number" ? (vue.openBlock(), vue.createElementBlock("input", {
              key: 1,
              class: "form-input",
              type: "digit",
              value: $props.modelValue[field.key] || "",
              placeholder: field.placeholder || "",
              onInput: ($event) => $options.onInput(field.key, $event.detail.value)
            }, null, 40, ["value", "placeholder", "onInput"])) : vue.createCommentVNode("v-if", true),
            field.type === "textarea" ? (vue.openBlock(), vue.createElementBlock("textarea", {
              key: 2,
              class: "form-textarea",
              value: $props.modelValue[field.key] || "",
              placeholder: field.placeholder || "",
              onInput: ($event) => $options.onInput(field.key, $event.detail.value)
            }, null, 40, ["value", "placeholder", "onInput"])) : vue.createCommentVNode("v-if", true),
            field.type === "radio" ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 3,
              class: "radio-group"
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(field.options, (opt) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: opt.value,
                    class: vue.normalizeClass(["radio-item", { "radio-active": $props.modelValue[field.key] === opt.value }]),
                    onClick: ($event) => $options.onInput(field.key, opt.value)
                  }, [
                    vue.createElementVNode(
                      "text",
                      { class: "radio-text" },
                      vue.toDisplayString(opt.label),
                      1
                      /* TEXT */
                    )
                  ], 10, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])) : vue.createCommentVNode("v-if", true),
            field.type === "select" ? (vue.openBlock(), vue.createElementBlock("picker", {
              key: 4,
              range: field.options,
              "range-key": "label",
              value: $options.getPickerIndex(field),
              onChange: ($event) => $options.onPickerChange(field, $event.detail.value)
            }, [
              vue.createElementVNode("view", { class: "form-input picker-display" }, [
                vue.createElementVNode(
                  "text",
                  {
                    class: vue.normalizeClass({ "placeholder-text": !$props.modelValue[field.key] })
                  },
                  vue.toDisplayString($options.getPickerLabel(field) || field.placeholder || "请选择"),
                  3
                  /* TEXT, CLASS */
                )
              ])
            ], 40, ["range", "value", "onChange"])) : vue.createCommentVNode("v-if", true),
            $data.errors[field.key] ? (vue.openBlock(), vue.createElementBlock(
              "text",
              {
                key: 5,
                class: "error-text"
              },
              vue.toDisplayString($data.errors[field.key]),
              1
              /* TEXT */
            )) : vue.createCommentVNode("v-if", true)
          ]);
        }),
        128
        /* KEYED_FRAGMENT */
      ))
    ]);
  }
  const SchemaForm = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-1bc78fcc"], ["__file", "D:/code/电力设备采集/components/SchemaForm.vue"]]);
  const _sfc_main$1 = {
    components: { SchemaForm },
    data() {
      return {
        taskId: "",
        deviceType: "",
        deviceId: "",
        currentSchema: null,
        attributes: {},
        longitude: 0,
        latitude: 0
      };
    },
    async onLoad(query) {
      formatAppLog("log", "at pages/device/edit.vue:63", "== edit.vue onLoad ==", JSON.stringify(query));
      this.taskId = query.taskId || "";
      this.deviceType = query.deviceType || "";
      this.currentSchema = getSchema(this.deviceType);
      formatAppLog("log", "at pages/device/edit.vue:69", "== currentSchema ==", this.currentSchema ? this.currentSchema.label : "NULL");
      if (query.deviceId) {
        this.deviceId = query.deviceId;
        const row = await dbHelper.selectOne(
          "SELECT * FROM t_device WHERE id=?",
          [query.deviceId]
        );
        if (row) {
          this.attributes = JSON.parse(row.attributes || "{}");
          this.longitude = row.longitude;
          this.latitude = row.latitude;
          formatAppLog("log", "at pages/device/edit.vue:82", "=== 回显数据 ===", this.attributes);
        }
      }
    },
    methods: {
      async loadDevice(id) {
        try {
          const row = await dbHelper.selectOne(
            "SELECT * FROM t_device WHERE id=?",
            [id]
          );
          if (row) {
            this.attributes = JSON.parse(row.attributes || "{}");
            this.longitude = row.longitude || 0;
            this.latitude = row.latitude || 0;
            formatAppLog("log", "at pages/device/edit.vue:97", "== 回显数据 ==", JSON.stringify(this.attributes));
          }
        } catch (e) {
          formatAppLog("error", "at pages/device/edit.vue:100", "加载设备失败", e);
        }
      },
      getLocation() {
        uni.getLocation({
          type: "gcj02",
          success: (res) => {
            this.longitude = res.longitude;
            this.latitude = res.latitude;
            uni.showToast({ title: "定位成功", icon: "success" });
          },
          fail: (err) => {
            formatAppLog("error", "at pages/device/edit.vue:113", "定位失败", err);
            uni.showToast({ title: "定位失败", icon: "none" });
          }
        });
      },
      async save() {
        const valid = this.$refs.formRef.validate();
        if (!valid) {
          uni.showToast({ title: "请填写必填项", icon: "none" });
          return;
        }
        formatAppLog("log", "at pages/device/edit.vue:127", "== 准备保存 ==");
        formatAppLog("log", "at pages/device/edit.vue:128", "deviceType:", this.deviceType);
        formatAppLog("log", "at pages/device/edit.vue:129", "attributes:", JSON.stringify(this.attributes));
        const now = Date.now();
        try {
          if (this.deviceId) {
            await dbHelper.execute(
              `UPDATE t_device SET
              attributes=?, longitude=?, latitude=?, updated_at=?, status=?
             WHERE id=?`,
              [
                JSON.stringify(this.attributes),
                this.longitude,
                this.latitude,
                now,
                "saved",
                this.deviceId
              ]
            );
          } else {
            this.deviceId = "dev_" + now;
            await dbHelper.execute(
              `INSERT INTO t_device
              (id, task_id, device_type, name, longitude, latitude, parent_id, attributes, photos, status, created_at, updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                this.deviceId,
                this.taskId,
                this.deviceType,
                this.attributes.pole_number || this.currentSchema.label,
                this.longitude,
                this.latitude,
                "",
                JSON.stringify(this.attributes),
                "[]",
                "saved",
                now,
                now
              ]
            );
          }
          uni.showToast({ title: "保存成功", icon: "success" });
          setTimeout(() => {
            uni.navigateBack();
          }, 1e3);
        } catch (e) {
          formatAppLog("error", "at pages/device/edit.vue:179", "保存失败", e);
          uni.showToast({ title: "保存失败: " + (e.message || ""), icon: "none" });
        }
      }
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_SchemaForm = vue.resolveComponent("SchemaForm");
    return vue.openBlock(), vue.createElementBlock("view", { class: "page" }, [
      vue.createElementVNode("view", { class: "header" }, [
        vue.createElementVNode(
          "text",
          { class: "header-title" },
          vue.toDisplayString($data.currentSchema ? $data.currentSchema.label : "加载中..."),
          1
          /* TEXT */
        )
      ]),
      $data.currentSchema ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "form-wrap"
      }, [
        vue.createVNode(_component_SchemaForm, {
          ref: "formRef",
          schema: $data.currentSchema,
          modelValue: $data.attributes,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $data.attributes = $event)
        }, null, 8, ["schema", "modelValue"]),
        vue.createElementVNode("view", { class: "coord-section" }, [
          vue.createElementVNode("text", { class: "coord-label" }, "当前坐标"),
          vue.createElementVNode(
            "text",
            { class: "coord-value" },
            vue.toDisplayString($data.longitude ? $data.longitude + ", " + $data.latitude : "尚未定位"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("button", {
            size: "mini",
            type: "default",
            onClick: _cache[1] || (_cache[1] = (...args) => $options.getLocation && $options.getLocation(...args)),
            style: { "margin-top": "10rpx" }
          }, " 获取定位 ")
        ]),
        vue.createElementVNode("button", {
          class: "save-btn",
          type: "primary",
          onClick: _cache[2] || (_cache[2] = (...args) => $options.save && $options.save(...args))
        }, " 保存 ")
      ])) : (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        style: { "padding": "40rpx", "text-align": "center" }
      }, [
        vue.createElementVNode(
          "text",
          null,
          "未找到设备类型 Schema: " + vue.toDisplayString($data.deviceType),
          1
          /* TEXT */
        )
      ]))
    ]);
  }
  const PagesDeviceEdit = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-32191578"], ["__file", "D:/code/电力设备采集/pages/device/edit.vue"]]);
  __definePage("pages/index/lineList", PagesIndexLineList);
  __definePage("pages/test/test", PagesTestTest);
  __definePage("pages/index/index", PagesIndexIndex);
  __definePage("pages/device/edit", PagesDeviceEdit);
  const _sfc_main = {
    onLaunch: function() {
      formatAppLog("log", "at App.vue:4", "App Launch");
    },
    onShow: function() {
      formatAppLog("log", "at App.vue:7", "App Show");
    },
    onHide: function() {
      formatAppLog("log", "at App.vue:10", "App Hide");
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/code/电力设备采集/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    return {
      app
    };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
