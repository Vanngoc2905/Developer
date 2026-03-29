using Microsoft.EntityFrameworkCore;
using QLQCF.Models;

namespace QLQCF.Repositories
{
    public class EFIngredientRepository : IIngredientRepository
    {
        private readonly ApplicationDbContext _context;
        public EFIngredientRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Ingredient>> GetAllAsync()
        {
            return await _context.Ingredients.ToListAsync();

        }

        public async Task<Ingredient?> GetByIdAsync(int id)
        {
            return await _context.Ingredients.FindAsync(id);

        }

        public async Task AddAsync(Ingredient ingredient)
        {
            _context.Ingredients.Add(ingredient);
            await _context.SaveChangesAsync();
        }
        public async Task UpdateAsync(Ingredient ingredient)
        {
            _context.Ingredients.Update(ingredient);
            await _context.SaveChangesAsync();
        }


        public async Task DeleteAsync(int id)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);
            if (ingredient != null)
            {
                _context.Ingredients.Remove(ingredient);
                await _context.SaveChangesAsync();
            }
        }
    }
}
