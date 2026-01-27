// WulinMaster 2.0 Entry Point
// This file粘合了 Monorepo 中的各个包，并保持与 Rails 资产管道的兼容性。

// 1. 外部依赖 (由主项目 package.json 提供)
import * as Turbo from "@hotwired/turbo"
import 'rails-ujs'
import 'materialize-css'
import 'flatpickr'
import { Sortable } from 'sortablejs'

// 2. 导入 Monorepo 内部包
import { 
  apiClient, 
  registry, 
  RemoteModel, 
  ConnectionManager, 
  displayNewNotification, 
  saveMessage, 
  handleAjaxError 
} from '@wulin-master/core'

import { 
  gridManager, 
  GridStatesManager, 
  Requests, 
  Ui, 
  ActionManager, 
  BaseAction, 
  BehaviorManager, 
  BaseBehavior,
  FilterPanel,
  DeleteAction,
  EditAction,
  CreateAction,
  FilterAction,
  FullscreenAction,
  ShowAllAction,
  HotkeyCreateAction,
  HotkeyDeleteAction,
  SwitchAction,
  AddDetailAction,
  ExportRolePermissionAction,
  ImportRolePermissionAction,
  MakeDefaultGridAction,
  CopyGridStatesAction,
  UpdateBehavior,
  ColumnFilterBehavior,
  AffiliationBehavior,
  AggregationBehavior,
  ValidateBehavior
} from './index'

import { registerWulinControllers } from '@wulin-master/stimulus'

// 3. 全局暴露 (保持向后兼容)
Object.assign(window, {
  Turbo,
  Sortable,
  apiClient,
  registry,
  RemoteModel,
  ConnectionManager,
  displayNewNotification,
  saveMessage,
  handleAjaxError,
  gridManager,
  GridStatesManager,
  Requests,
  Ui,
  __globalWillAppend: false
});

window.WulinMaster = window.WulinMaster || {}
Object.assign(window.WulinMaster, {
  ActionManager,
  actions: { 
    ...(window.WulinMaster.actions || {}), 
    BaseAction,
    Delete: DeleteAction,
    Edit: EditAction,
    Create: CreateAction,
    Filter: FilterAction,
    Fullscreen: FullscreenAction,
    ShowAll: ShowAllAction,
    HotkeyCreate: HotkeyCreateAction,
    HotkeyDelete: HotkeyDeleteAction,
    Switch: SwitchAction,
    AddDetail: AddDetailAction,
    ExportRolePermission: ExportRolePermissionAction,
    ImportRolePermission: ImportRolePermissionAction,
    MakeDefaultGrid: MakeDefaultGridAction,
    CopyGridStates: CopyGridStatesAction
  },
  BehaviorManager,
  behaviors: { 
    ...(window.WulinMaster.behaviors || {}), 
    BaseBehavior,
    Update: UpdateBehavior,
    ColumnFilter: ColumnFilterBehavior,
    Affiliation: AffiliationBehavior,
    Aggregation: AggregationBehavior,
    Validate: ValidateBehavior
  },
  FilterPanel
});

// 4. 自动注册 Stimulus 控制器
// 注意：在 Rails 应用中，主 application.js 通常会初始化 Stimulus
// 这里我们提供 an 便捷方法，或者如果 window.Stimulus 已存在则自动注册
if (window.Stimulus) {
  registerWulinControllers(window.Stimulus)
}

// 5. 导入样式 (SlickGrid v5+)
import 'slickgrid/dist/styles/css/slick.grid.css'
import 'slickgrid/dist/styles/css/slick-default-theme.css'
import 'slickgrid/dist/styles/css/slick-icons.css'
import './tailwind.css'

// 6. 导入本地非模块化插件 (Dropzone 等)
// import '../dropzone.min.js'

window.__globalWillAppend = false

// 深拷贝工具 (Legacy)
window.deep_clone = window.deep_clone || function(myObj){
  if(typeof(myObj) != 'object' || Array.isArray(myObj)) return myObj;
  if(myObj == null) return myObj;
  var myNewObj = new Object();
  for(var i in myObj) myNewObj[i] = window.deep_clone(myObj[i]);
  return myNewObj;
};
