// Mock global window objects for tests
(global as any).window = global;
(global as any).WulinMaster = {
  gridManager: {
    getGrid: jest.fn(),
    grids: []
  },
  Ui: {},
  M: {
    Modal: {
      getInstance: jest.fn(() => ({ close: jest.fn() })),
      init: jest.fn()
    },
    toast: jest.fn()
  }
};

(global as any).Slick = {
  Event: jest.fn(() => ({
    subscribe: jest.fn(),
    notify: jest.fn()
  }))
};
