using Microsoft.EntityFrameworkCore;
using QLQCF.Models;

namespace QLQCF.Repositories
{
    public class EFCategoryDetailRepository : ICategoryDetailRepository
    {
        private readonly ApplicationDbContext _context;

        public EFCategoryDetailRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // Lấy tất cả CategoryDetail kèm theo thông tin Category
        public async Task<IEnumerable<CategoryDetail>> GetAllAsync()
        {
            return await _context.CategoryDetails
                .Include(cd => cd.Category) // ✅ Load thêm thông tin danh mục
                .ToListAsync();
        }

        // Lấy CategoryDetail theo Id (bao gồm thông tin Category)
        public async Task<CategoryDetail> GetByIdAsync(int id)
        {
            return await _context.CategoryDetails
                .Include(cd => cd.Category) // ✅ Load thêm thông tin danh mục
                .FirstOrDefaultAsync(cd => cd.Id == id);
        }

        // Lấy tất cả CategoryDetail theo Id của Category
        public async Task<IEnumerable<CategoryDetail>> GetByCategoryIdAsync(int categoryId)
        {
            return await _context.CategoryDetails
                .Where(cd => cd.CategoryId == categoryId)
                .Include(cd => cd.Category) // ✅ Load thêm thông tin danh mục
                .ToListAsync();
        }

        // Thêm mới CategoryDetail
        public async Task AddAsync(CategoryDetail categoryDetail)
        {
            _context.CategoryDetails.Add(categoryDetail);
            await _context.SaveChangesAsync();
        }

        // Cập nhật CategoryDetail
        public async Task UpdateAsync(CategoryDetail categoryDetail)
        {
            _context.CategoryDetails.Update(categoryDetail);
            await _context.SaveChangesAsync();
        }

        // Xóa CategoryDetail
        public async Task DeleteAsync(int id)
        {
            var categoryDetail = await _context.CategoryDetails.FindAsync(id);
            if (categoryDetail != null)
            {
                _context.CategoryDetails.Remove(categoryDetail);
                await _context.SaveChangesAsync();
            }
        }
    }
}
