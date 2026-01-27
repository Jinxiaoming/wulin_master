// WulinMaster 2.0 Entry Point
// This file粘合了 Monorepo 中的各个包，并保持与 Rails 资产管道的兼容性。

// 1. 外部依赖 (由主项目 package.json 提供)
import * as Turbo from "@hotwired/turbo"
window.Turbo = Turbo
import 'rails-ujs'
import 'materialize-css'
import 'flatpickr'
import { Sortable } from 'sortablejs'
window.Sortable = Sortable

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
  FilterPanel
} from './index'

import { registerWulinControllers } from '@wulin-master/stimulus'

// 3. 全局暴露 (保持向后兼容)
window.apiClient = apiClient
window.registry = registry
window.RemoteModel = RemoteModel
window.ConnectionManager = ConnectionManager
window.displayNewNotification = displayNewNotification
window.saveMessage = saveMessage
window.handleAjaxError = handleAjaxError

window.gridManager = gridManager
window.GridStatesManager = GridStatesManager
window.Requests = Requests
window.Ui = Ui
window.WulinMaster = window.WulinMaster || {}
window.WulinMaster.ActionManager = ActionManager
window.WulinMaster.actions = window.WulinMaster.actions || {}
window.WulinMaster.actions.BaseAction = BaseAction
window.WulinMaster.BehaviorManager = BehaviorManager
window.WulinMaster.behaviors = window.WulinMaster.behaviors || {}
window.WulinMaster.behaviors.BaseBehavior = BaseBehavior
window.WulinMaster.FilterPanel = FilterPanel

// 4. 自动注册 Stimulus 控制器
// 注意：在 Rails 应用中，主 application.js 通常会初始化 Stimulus
// 这里我们提供 an 便捷方法，或者如果 window.Stimulus 已存在则自动注册
if (window.Stimulus) {
  registerWulinControllers(window.Stimulus)
}

// 5. 导入样式 (SlickGrid v5+)
import 'slickgrid/dist/styles/css/slick.grid.css'
import 'slickgrid/dist/styles/css/slick-default-theme.css'

// 6. 导入本地非模块化插件 (Dropzone 等)
import '../dropzone.min.js'

window.__globalWillAppend = false

// 深拷贝工具 (Legacy)
window.deep_clone = window.deep_clone || function(myObj){
  if(typeof(myObj) != 'object' || Array.isArray(myObj)) return myObj;
  if(myObj == null) return myObj;
  var myNewObj = new Object();
  for(var i in myObj) myNewObj[i] = window.deep_clone(myObj[i]);
  return myNewObj;
};
