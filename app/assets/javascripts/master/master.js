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
import NotificationController from "./controllers/notification_controller"
import ModalController from "./controllers/modal_controller"
import LoaderController from "./controllers/loader_controller"
import MaterializeController from "./controllers/materialize_controller"
import PanelController from "./controllers/panel_controller"
import NavigationController from "./controllers/navigation_controller"
import ScreenController from "./controllers/screen_controller"
import GridController from "./controllers/grid_controller"
import FormController from "./controllers/form_controller"
import InclusionExclusionController from "./controllers/inclusion_exclusion_controller"
import GridStatesController from "./controllers/grid_states_controller"
import ToolbarController from "./controllers/toolbar_controller"

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
import 'slickgrid/dist/styles/css/slick.grid.css'
import 'slickgrid/dist/styles/css/slick-default-theme.css'
import 'slickgrid/dist/browser/slick.core'
import 'slickgrid/dist/browser/slick.grid'
import 'slickgrid/dist/browser/controls/slick.columnpicker'
import 'slickgrid/dist/browser/controls/slick.pager'
import 'slickgrid/dist/browser/plugins/slick.autotooltips'
import 'slickgrid/dist/browser/plugins/slick.cellcopymanager'
import 'slickgrid/dist/browser/plugins/slick.cellrangedecorator'
import 'slickgrid/dist/browser/plugins/slick.cellrangeselector'
import 'slickgrid/dist/browser/plugins/slick.cellselectionmodel'
import 'slickgrid/dist/browser/plugins/slick.checkboxselectcolumn'
import 'slickgrid/dist/browser/plugins/slick.rowdetailview'
import 'slickgrid/dist/browser/plugins/slick.rowselectionmodel'

// Core master files (in dependency order)
import './escape_html.js'
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
import './grid_requests.js'
import './grid_states_manager.js'
import './loader.js'
import './materialize_auto_init.js'
import './menu.js'
import './panel.js'
import RemoteModel from './remotemodel.js'
import './row_detail_templates.js'
import './ui_helper.js'
import './grid_manager.js'

// Managers
import './behavior_manager.js'
import './action_manager.js'

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
