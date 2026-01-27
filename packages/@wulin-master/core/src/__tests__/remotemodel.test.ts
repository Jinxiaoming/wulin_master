import RemoteModel from '../remotemodel';

describe('RemoteModel', () => {
  let model: RemoteModel;
  const path = '/test_data.json';
  const columns = [{ id: 'name', field: 'name', name: 'Name' }];

  beforeEach(() => {
    model = new RemoteModel(path, [], columns);
    (model as any).grid = {
      allColumns: columns,
      getOptions: () => ({})
    };
  });

  test('initialization sets correct path and columns', () => {
    expect((model as any).path).toBe(path);
    expect(model.getColumns()).toEqual(columns);
  });

  test('clear resets data length', () => {
    model.data[0] = { id: 1, name: 'Test' };
    model.data.length = 1;
    model.clear();
    expect(model.data.length).toBe(0);
    expect(model.data[0]).toBeUndefined();
  });

  test('isDataLoaded checks range', () => {
    model.data[0] = { id: 1 };
    model.data[1] = { id: 2 };
    expect(model.isDataLoaded(0, 1)).toBe(true);
    expect(model.isDataLoaded(0, 2)).toBe(false);
  });

  test('generateUrl constructs correct URL with filters', () => {
    (model as any).filters = [['name', 'test', 'equals']];
    const [url] = model.generateUrl(0, 100) as [string, boolean];
    expect(url).toContain('offset=0');
    expect(url).toContain('count=200'); // loadingSize default
    expect(url).toContain('filters[][column]=name');
    expect(url).toContain('filters[][value]=test');
  });
});
