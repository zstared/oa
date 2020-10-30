import m_table from '../../model/core/table';

class UserService {
  constructor() {}

  /**
   * 获取权限
   * @param {number} id
   */
  async getTableColumn(table_code) {
    const table = await m_table.getTableByCode(table_code);
    const columns = await m_table.getTableColumns(table.dataValues.id);
    table.dataValues.columns = columns;

    return table;
  }
}
export default new UserService();
