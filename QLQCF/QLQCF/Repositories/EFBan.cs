using Microsoft.EntityFrameworkCore;
using QLQCF.Models;

namespace QLQCF.Repositories
{
    /// <summary>
    /// Repository triển khai interface IBan, sử dụng Entity Framework để thao tác với dữ liệu bàn.
    /// </summary>
    public class EFBan : IBan
    {
        private readonly ApplicationDbContext _context;

        public EFBan(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Lấy danh sách tất cả bàn (không tracking).
        /// </summary>
        public async Task<IEnumerable<Ban>> GetAllAsync()
        {
            return await _context.Bans
                                 .AsNoTracking()
                                 .ToListAsync();
        }

        /// <summary>
        /// Lấy thông tin bàn theo ID (không tracking).
        /// </summary>
        public async Task<Ban?> GetByIdAsync(int id)
        {
            return await _context.Bans
                                 .AsNoTracking()
                                 .FirstOrDefaultAsync(b => b.Id == id);
        }

        /// <summary>
        /// Thêm một bàn mới vào cơ sở dữ liệu.
        /// </summary>
        public async Task AddAsync(Ban ban)
        {
            if (ban == null) throw new ArgumentNullException(nameof(ban));

            await _context.Bans.AddAsync(ban);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Cập nhật thông tin bàn.
        /// </summary>
        public async Task UpdateAsync(Ban ban)
        {
            if (ban == null) throw new ArgumentNullException(nameof(ban));

            _context.Bans.Update(ban);
            await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Xoá bàn theo ID nếu tồn tại.
        /// </summary>
        public async Task DeleteAsync(int id)
        {
            var ban = await _context.Bans.FindAsync(id);
            if (ban != null)
            {
                _context.Bans.Remove(ban);
                await _context.SaveChangesAsync();
            }
        }
    }
}
