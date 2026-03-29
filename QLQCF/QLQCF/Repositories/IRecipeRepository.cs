using QLQCF.Models;

namespace QLQCF.Repositories
{
    public interface IRecipeRepository
    {
        Task<IEnumerable<Recipe>> GetAllAsync();
        Task<Recipe?> GetByIdAsync(int id);
        Task AddAsync(Recipe recipe);
        Task UpdateAsync(Recipe recipe);


        Task<Recipe?> GetByProductAndIngredientAsync(int productId, int ingredientId);
        Task<IEnumerable<Recipe>> GetByProductIdAsync(int productId);
        Task DeleteAsync(Recipe recipe);
        Task<IEnumerable<object>> GetByIngredientIdAsync(int id);
        Task DeleteAsync(object id);
    }
}
