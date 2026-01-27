import NotificationController from './notification_controller.js';
import ModalController from './modal_controller.js';
import LoaderController from './loader_controller.js';
import MaterializeController from './materialize_controller.js';
import PanelController from './panel_controller.js';
import NavigationController from './navigation_controller.js';
import ScreenController from './screen_controller.js';
import GridController from './grid_controller.js';
import FormController from './form_controller.js';
import InclusionExclusionController from './inclusion_exclusion_controller.js';
import GridStatesController from './grid_states_controller.js';
import ToolbarController from './toolbar_controller.js';

export const controllers = {
  notification: NotificationController,
  modal: ModalController,
  loader: LoaderController,
  materialize: MaterializeController,
  panel: PanelController,
  navigation: NavigationController,
  screen: ScreenController,
  grid: GridController,
  form: FormController,
  "inclusion-exclusion": InclusionExclusionController,
  "grid-states": GridStatesController,
  toolbar: ToolbarController
};

export function registerWulinControllers(application) {
  Object.entries(controllers).forEach(([name, controller]) => {
    application.register(name, controller);
  });
}

export {
  NotificationController,
  ModalController,
  LoaderController,
  MaterializeController,
  PanelController,
  NavigationController,
  ScreenController,
  GridController,
  FormController,
  InclusionExclusionController,
  GridStatesController,
  ToolbarController
};
