using QLQCF.Models;

namespace QLQCF.Repositories
{
    public interface ICategoryDetailRepository
    {
        Task<IEnumerable<CategoryDetail>> GetAllAsync();
        Task<CategoryDetail> GetByIdAsync(int id);
        Task AddAsync(CategoryDetail categoryDetail);
        Task UpdateAsync(CategoryDetail categoryDetail);
        Task DeleteAsync(int id);

        Task<IEnumerable<CategoryDetail>> GetByCategoryIdAsync(int categoryId);
    }
}
