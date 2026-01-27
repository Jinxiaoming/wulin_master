import NotificationController from './notification_controller';
import ModalController from './modal_controller';
import LoaderController from './loader_controller';
import MaterializeController from './materialize_controller';
import PanelController from './panel_controller';
import NavigationController from './navigation_controller';
import ScreenController from './screen_controller';
import GridController from './grid_controller';
import FormController from './form_controller';
import InclusionExclusionController from './inclusion_exclusion_controller';
import GridStatesController from './grid_states_controller';
import ToolbarController from './toolbar_controller';

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
