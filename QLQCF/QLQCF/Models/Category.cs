using System.ComponentModel.DataAnnotations;

namespace QLQCF.Models
{
    public class Category
    {
        public int Id { get; set; }
        [Required, StringLength(50)]
        public string Name { get; set; }
 
        public List<CategoryDetail>? CategoryDetail { get; set; }
    }
}
