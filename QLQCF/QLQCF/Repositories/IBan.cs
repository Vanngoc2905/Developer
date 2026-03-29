using QLQCF.Models;

namespace QLQCF.Repositories
{
    public interface IBan
    {
        Task<IEnumerable<Ban>> GetAllAsync();
        Task<Ban> GetByIdAsync(int id);
        Task AddAsync(Ban ban);
        Task UpdateAsync(Ban ban);
        Task DeleteAsync(int id);
    }
}
