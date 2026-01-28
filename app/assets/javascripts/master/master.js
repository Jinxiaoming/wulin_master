// External dependencies
import * as Turbo from "@hotwired/turbo"
window.Turbo = Turbo

import 'rails-ujs'
import 'materialize-css'

// Import NPM managed dependencies
import 'flatpickr'
import TomSelect from 'tom-select'
window.TomSelect = TomSelect
import Inputmask from 'inputmask'
window.Inputmask = Inputmask
import { Sortable } from 'sortablejs'
window.Sortable = Sortable;

// Initialize Stimulus
import { Application } from "@hotwired/stimulus"
const application = Application.start()
window.Stimulus = application

// Register Stimulus Controllers
import NotificationController from "../controllers/notification_controller"
import ModalController from "../controllers/modal_controller"
import LoaderController from "../controllers/loader_controller"
import MaterializeController from "../controllers/materialize_controller"
import PanelController from "../controllers/panel_controller"
import NavigationController from "../controllers/navigation_controller"
import ScreenController from "../controllers/screen_controller"
import GridController from "../controllers/grid_controller"
import FormController from "../controllers/form_controller"
import InclusionExclusionController from "../controllers/inclusion_exclusion_controller"
import GridStatesController from "../controllers/grid_states_controller"
import ToolbarController from "../controllers/toolbar_controller"

application.register("notification", NotificationController)
application.register("modal", ModalController)
application.register("loader", LoaderController)
application.register("materialize", MaterializeController)
application.register("panel", PanelController)
application.register("navigation", NavigationController)
application.register("screen", ScreenController)
application.register("grid", GridController)
application.register("form", FormController)
application.register("inclusion-exclusion", InclusionExclusionController)
application.register("grid-states", GridStatesController)
application.register("toolbar", ToolbarController)

// SlickGrid dependencies from NPM
import * as SlickGrid from 'slickgrid'
import { extendSlickGrid } from './slick_grid_extensions.js'

window.Slick = {
  ...SlickGrid,
  Grid: SlickGrid.SlickGrid,
  Event: SlickGrid.SlickEvent,
  EventData: SlickGrid.SlickEventData,
  EventHandler: SlickGrid.SlickEventHandler,
  Range: SlickGrid.SlickRange,
  RowSelectionModel: SlickGrid.SlickRowSelectionModel,
  CheckboxSelectColumn: SlickGrid.SlickCheckboxSelectColumn,
  AutoTooltips: SlickGrid.SlickAutoTooltips,
  Plugins: {
    RowDetailView: SlickGrid.SlickRowDetailView,
    ContextMenu: SlickGrid.SlickContextMenu
  },
  Controls: {
    ColumnPicker: SlickGrid.SlickColumnPicker,
    Pager: SlickGrid.SlickGridPager
  }
}

// Apply WulinMaster extensions to SlickGrid
if (SlickGrid && SlickGrid.SlickGrid) {
  extendSlickGrid(SlickGrid.SlickGrid)
}

// Core master files (in dependency order)
import './escape_html.js'
import apiClient from './api_client.js'
import './utility.js'
import './datetime.js'
import './notifications.js'
import './wulin_form.js'
import './ajax_error_handler.js'
import ConnectionManager from './connectionmanager.js'
import './dialog.js'
import './editors.js'
import './filterpanel.js'
import './formatters.js'
import Requests from './grid_requests.js'
import GridStatesManager from './grid_states_manager.js'
import './loader.js'
import './materialize_auto_init.js'
import './menu.js'
import './panel.js'
import RemoteModel from './remotemodel.js'
import './row_detail_templates.js'
import Ui from './ui_helper.js'
import { gridManager } from './grid_manager.js'
import { BehaviorManager, BaseBehavior } from './behavior_manager.js'
import { ActionManager, BaseAction } from './action_manager.js'

// Global exposure for legacy compatibility and cross-module access
window.apiClient = apiClient;
window.Ui = Ui;
window.Requests = Requests;
window.GridStatesManager = GridStatesManager;
window.gridManager = gridManager;
window.WulinMaster = window.WulinMaster || {};
window.WulinMaster.BehaviorManager = BehaviorManager;
window.WulinMaster.behaviors = window.WulinMaster.behaviors || {};
window.WulinMaster.behaviors.BaseBehavior = BaseBehavior;
window.WulinMaster.ActionManager = ActionManager;
window.WulinMaster.actions = window.WulinMaster.actions || {};
window.WulinMaster.actions.BaseAction = BaseAction;

// Wulin Master Behaviors
import './behaviors/add_candidate_filter.js'
import './behaviors/affiliation.js'
import './behaviors/aggregation.js'
import './behaviors/clear_detail_when_multi_select.js'
import './behaviors/clear_filters.js'
import './behaviors/color_columns.js'
import './behaviors/column_filter.js'
import './behaviors/disable_sorting_initially.js'
import './behaviors/disable_toolbar_initially.js'
import './behaviors/empty_detail.js'
import './behaviors/enable_sorting_after_loading.js'
import './behaviors/enable_toolbar_after_loading.js'
import './behaviors/get_operate_ids.js'
import './behaviors/highlight.js'
import './behaviors/include_exclude_trivia.js'
import './behaviors/update.js'
import './behaviors/validate.js'

// Wulin Master Actions
import './actions/add_detail.js'
import './actions/copy_grid_states.js'
import './actions/create.js'
import './actions/delete.js'
import './actions/detail_add.js'
import './actions/dynamic_edit.js'
import './actions/edit.js'
import './actions/export_role_permission.js'
import './actions/filter_default_grid_states.js'
import './actions/filter.js'
import './actions/fullscreen.js'
import './actions/hotkey_create.js'
import './actions/hotkey_delete.js'
import './actions/import_role_permission.js'
import './actions/json_view.js'
import './actions/make_default_grid.js'
import './actions/multiple_grid_states.js'
import './actions/show_all.js'
import './actions/switch.js'

// Dropzone
import '../dropzone.min.js'

window.__globalWillAppend = false

// Expose deep_clone globally for backward compatibility
window.deep_clone = window.deep_clone || function(myObj){
  if(typeof(myObj) != 'object' || myObj instanceof Array) return myObj;
  if(myObj == null) return myObj;

  var myNewObj = new Object();

  for(var i in myObj)
     myNewObj[i] = window.deep_clone(myObj[i]);

  return myNewObj;
};
