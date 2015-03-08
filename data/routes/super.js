
import Controller from '../../lib/ez-ctrl'

export class BaseController extends Controller {}
export class SuperController extends BaseController {}
export class OtherController extends BaseController {}

SuperController.defineRoutes({
  overridden() {
    return 'super';
  },
  custom() {
    return 'super';
  }
});

BaseController.defineRoutes({
  overridden() {
    return 'base';
  },
  notOverriden() {
    return 'base';
  },
});

OtherController.defineRoutes({
  overridden() {
    return 'other';
  },
  custom() {
    return 'other';
  }
});
