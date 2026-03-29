using QLQCF.Models;

namespace QLQCF.Repositories
{
    public interface IIngredientRepository
    {

        Task<IEnumerable<Ingredient>> GetAllAsync();
        Task<Ingredient> GetByIdAsync(int id);
        Task AddAsync(Ingredient ingredient);
        Task UpdateAsync(Ingredient ingredient);
        Task DeleteAsync(int id);
    }
}
